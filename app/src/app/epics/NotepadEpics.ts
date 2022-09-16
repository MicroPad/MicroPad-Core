import { actions, MicroPadAction, MicroPadActions, READ_ONLY_ACTIONS } from '../actions';
import {
	catchError,
	concatMap,
	filter,
	map,
	mergeMap,
	retry,
	switchMap,
	tap,
	throttleTime,
	withLatestFrom
} from 'rxjs/operators';
import { Action } from 'typescript-fsa';
import { combineEpics, ofType } from 'redux-observable';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import saveAs from 'save-as';
import JSZip from 'jszip';
import { filterTruthy, fixFileName, generateGuid, noEmit, unreachable } from '../util';
import { Dialog } from '../services/dialogs';
import { ISyncedNotepad } from '../types/SyncTypes';
import {
	Asset,
	FlatNotepad,
	moveNote,
	moveSection,
	Note,
	Notepad,
	RestructuredNotepads,
	Translators
} from 'upad-parse/dist';
import { MarkdownNote } from 'upad-parse/dist/Note';
import { from, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { EncryptNotepadAction, MoveAcrossNotepadsObjType } from '../types/ActionTypes';
import { format } from 'date-fns';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { DecryptionError, fromShell } from '../services/CryptoService';
import { ASSET_STORAGE, NOTEPAD_STORAGE, store as STORE } from '../root';
import { EpicDeps, EpicStore } from './index';

const parseQueue: string[] = [];

const parseNpx$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.parseNpx.started.type),
		switchMap(action =>
			from((async () => {
				let notepad: Notepad;
				try {
					notepad = await Translators.Xml.toNotepadFromNpx((action as MicroPadActions['parseNpx']['started']).payload);
				} catch (err) {
					Dialog.alert(`Error reading file`);
					console.error(err);
					throw err;
				}

				// Save assets to localforage
				await Promise.all(notepad.assets.map(async asset => ASSET_STORAGE.setItem(asset.uuid, asset.data)));

				return notepad.flatten();
			})())
				.pipe(
					map((notepad: FlatNotepad) => actions.parseNpx.done({ params: '', result: notepad })),
					catchError(err => of(actions.parseNpx.failed({ params: '', error: err })))
				)
		)
	);

const syncOnNotepadParsed$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.updateCurrentSyncId.type),
		map(() => state$.value),
		map(state => state.notepads.notepad),
		filter((npState): npState is INotepadStoreState => !!npState && !!npState.item),
		map((npState: INotepadStoreState) => actions.actWithSyncNotepad({
			notepad: (npState.item!).toNotepad(),
			action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId: npState.activeSyncId! })
		}))
	);

const parseEnex$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.parseEnex.type),
		switchMap(action =>
			from((async () => {
				let notepad: Notepad;
				try {
					notepad = await Translators.Xml.toNotepadFromEnex((action as MicroPadActions['parseEnex']).payload);
				} catch (err) {
					Dialog.alert(`Error reading file`);
					console.error(err);
					throw err;
				}

				// Save assets to localforage
				await Promise.all(notepad.assets.map(async asset => ASSET_STORAGE.setItem(asset.uuid, asset.data)));

				return notepad.flatten();
			})())
				.pipe(
					map((notepad: FlatNotepad) => actions.parseNpx.done({ params: '', result: notepad })),
					catchError(err => of(actions.parseNpx.failed({ params: '', error: err })))
				)
		)
	);

const parseMarkdownImport$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.importMarkdown.type),
		map(action => (action as MicroPadActions['importMarkdown']).payload),
		map(markdownNotes => {
			try {
				return Translators.Markdown.toNotepadFromMarkdown(markdownNotes);
			} catch (e) {
				console.error(e);
				Dialog.alert(`Error importing markdown`);
				return false;
			}
		}),
		filter((np): np is Notepad => !!np),
		map((np: Notepad) => actions.parseNpx.done({ params: '', result: np.flatten() }))
	);

// This is what's used in sync. It is more active to prompt for passkeys than other variants
const restoreJsonNotepad$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.restoreJsonNotepad.type),
		map(action => (action as MicroPadActions['restoreJsonNotepad']).payload),
		switchMap((json: string) => from((async () => {
			try {
				const shell: NotepadShell = JSON.parse(json);
				let res: EncryptNotepadAction;

				const passkey: string | undefined = state$.value.notepadPasskeys[shell.title];
				if (passkey) {
					res = await fromShell(shell, passkey).catch(() => fromShell(shell));
				} else {
					res = await fromShell(shell)
				}

				return [
					actions.addCryptoPasskey({
						notepadTitle: res.notepad.title,
						passkey: res.passkey,
						remember: res.rememberKey
					}),
					actions.parseNpx.done({
						params: '',
						result: res.notepad.flatten()
					})
				];
			} catch (err) {
				if (err instanceof DecryptionError) {
					Dialog.alert(err.message);
					console.warn(err);
				} else {
					Dialog.alert(`Error restoring notepad`);
					console.error(err);
				}

				return [actions.parseNpx.failed({
					params: '',
					error: err
				})];
			}
		})())),
		mergeMap((restoreActions: Action<any>[]) => [...restoreActions])
	);

type DecryptedShellContainer = Omit<EncryptNotepadAction, 'notepad'> & { notepad: FlatNotepad, noteRef: string };
const restoreJsonNotepadAndLoadNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }) =>
	action$.pipe(
		ofType(actions.restoreJsonNotepadAndLoadNote.type),
		map(action => (action as MicroPadActions['restoreJsonNotepadAndLoadNote']).payload),
		switchMap(result =>
			from((getStorage().notepadStorage as LocalForage).getItem<string>(result.notepadTitle)).pipe(
				switchMap(notepadJson =>
					from(fromShell(JSON.parse(notepadJson!), state$.value.notepadPasskeys[result.notepadTitle]))
				),
				map((res): DecryptedShellContainer => ({ ...res, notepad: res.notepad.flatten(), noteRef: result.noteRef })),
				catchError(err => {
					console.error(err);

					if (err instanceof DecryptionError) {
						Dialog.alert(err.message);
					} else {
						Dialog.alert(`There was an error opening your notebook`);
					}
					return of(null);
				})
			)
		),
		filterTruthy(),
		concatMap(res => [
			actions.addCryptoPasskey({ notepadTitle: res.notepad.title, passkey: res.passkey, remember: res.rememberKey }),
			actions.parseNpx.done({ params: '', result: res.notepad }),
			actions.loadNote.started(res.noteRef)
		])
	);

const exportNotepad$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.exportNotepad.type),
		withLatestFrom(state$),
		map(([,state]) => state.notepads?.notepad?.item),
		filterTruthy(),
		switchMap((notepad: FlatNotepad) =>
			from(getNotepadXmlWithAssets(notepad.toNotepad()))
		),
		tap((exportedNotepad: IExportedNotepad) => {
			const blob = new Blob([exportedNotepad.content as BlobPart], { type: 'text/xml;charset=utf-8' });
			saveAs(blob, `${fixFileName(exportedNotepad.title)}.npx`);
		}),
		noEmit()
	);

const exportAll$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.exportAll.started.type),
		map(() => state$.value),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filterTruthy(),
		switchMap((titles: string[]) => {
			const notepadsInStorage: Promise<string | null>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return from(Promise.all(notepadsInStorage)).pipe(
				map((notepads: Array<string | null>) => notepads.filter(json => !!json) as string[]),
				switchMap((notepads: string[]) => {
					const pendingXml = notepads.map(async (notepadJSON: string) => {
						const shell: NotepadShell = JSON.parse(notepadJSON);

						const notepad = (await fromShell(shell, state$.value.notepadPasskeys[shell.title])).notepad;
						return await getNotepadXmlWithAssets(notepad);
					});

					return from(Promise.all(pendingXml));
				}),
				switchMap((exportNotepads: IExportedNotepad[]) => {
					const zip: JSZip = new JSZip();

					exportNotepads.forEach((exportedNotepad: IExportedNotepad) => {
						const blob: Blob = new Blob([exportedNotepad.content as string], { type: 'text/xml;charset=utf-8' });
						zip.file(`${fixFileName(exportedNotepad.title)}.npx`, blob);
					});

					return from(zip.generateAsync({
						type: 'blob',
						compression: 'DEFLATE'
					})).pipe(
						map((zipBlob: Blob) => actions.exportAll.done({ params: undefined, result: zipBlob })),
						catchError(err => of(actions.exportAll.failed({ params: undefined, error: err })))
					);
				}),
				catchError(err => {
					console.error(err);
					Dialog.alert(err.message);
					return of(actions.exportAll.failed({ params: undefined, error: err }));
				})
			);
		})
	);

const exportAllToMarkdown$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.exportToMarkdown.started.type),
		map(() => state$.value),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filterTruthy(),
		switchMap((titles: string[]) => {
			const notepadsInStorage: Promise<string | null>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return from(Promise.all(notepadsInStorage)).pipe(
				map((notepads: Array<string | null>) => notepads.filter(json => !!json) as string[]),
				switchMap((notepads: string[]) => {
					const pendingContent = notepads.map(async (notepadJSON: string) => {
						const shell: NotepadShell = JSON.parse(notepadJSON);

						const notepad = (await fromShell(shell, state$.value.notepadPasskeys[shell.title])).notepad;
						return await getNotepadMarkdownWithAssets(notepad);
					});

					return from(Promise.all(pendingContent));
				}),
				switchMap((exportNotepads: IExportedNotepad[]) => {
					const zip: JSZip = new JSZip();

					exportNotepads.forEach((exportedNotepad: IExportedNotepad) => {
						(exportedNotepad.content as MarkdownNote[]).forEach(mdNote =>
							zip.file(
								`${fixFileName(exportedNotepad.title)}/${fixFileName(mdNote.title)}.md`,
								new Blob([mdNote.md], { type: 'text/markdown;charset=utf-8' })
							)
						);
					});

					return from(zip.generateAsync({
						type: 'blob',
						compression: 'DEFLATE'
					})).pipe(
						map((zipBlob: Blob) => actions.exportAll.done({ params: undefined, result: zipBlob })),
						catchError(err => of(actions.exportAll.failed({ params: undefined, error: err })))
					);
				}),
				catchError(err => {
					console.error(err);
					Dialog.alert(err.message);
					return of(actions.exportToMarkdown.failed({ params: undefined, error: err }));
				})
			);
		})
	);

const exportAllDone$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.exportAll.done.type, actions.exportToMarkdown.done.type),
		map(action => (action as MicroPadActions['exportAll']['done'] | MicroPadActions['exportToMarkdown']['done']).payload.result),
		tap(zip => saveAs(zip, `notepads.zip`)),
		filter((_a): _a is never => false)
	);

const renameNotepad$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.renameNotepad.started.type),
		filter(() => !!state$.value.notepads.notepad?.item?.title),
		switchMap(action => {
			const oldTitle = state$.value.notepads.notepad?.item?.title!;

			return from(NOTEPAD_STORAGE.removeItem(oldTitle))
				.pipe(
					map(() => { return { newTitle: (action as MicroPadActions['renameNotepad']['started']).payload, oldTitle }; })
				);
		}),
		map((res: { newTitle: string, oldTitle: string }) => actions.renameNotepad.done({ params: res.newTitle, result: res.oldTitle }))
	);

const saveNotepadOnRenameOrNew$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.renameNotepad.done.type, actions.parseNpx.done.type),
		map(() => state$.value.notepads.notepad?.item),
		filterTruthy(),
		map(notepad => actions.saveNotepad.started(notepad.toNotepad()))
	);

const downloadExternalNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.downloadNotepad.started.type),
		map(action => (action as MicroPadActions['downloadNotepad']['started']).payload),
		switchMap(url => from(Dialog.confirm(`Are you sure you want to download this notepad: ${url}?`)).pipe(
			map((shouldDownload): [string, boolean] => [url, shouldDownload])
		)),
		filter(([,shouldDownload]: [string, boolean]) => shouldDownload),
		map(([url]: [string, boolean]) => url),
		mergeMap((url: string) =>
			ajax<string>({
				url,
				crossDomain: true,
				headers: {
					'Content-Type': 'text/plain; charset=UTF-8'
				},
				responseType: 'text'
			}).pipe(
				map(res => actions.parseNpx.started(res.response)),
				retry(2),
				catchError(err => {
					Dialog.alert(`Download failed. Are you online?`);
					return of(actions.downloadNotepad.failed({ params: url, error: err }));
				})
			)
		)
	);

const queueParseNpx$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.queueParseNpx.type),
		map(action => (action as MicroPadActions['queueParseNpx']).payload),
		tap((xml: string) => {
			if (parseQueue.length > 0) parseQueue.push(xml);
		}),
		filter(() => parseQueue.length === 0),
		tap(() => parseQueue.push('')),
		map((xml: string) => actions.parseNpx.started(xml))
	);

const getNextParse$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.parseNpx.done.type),
		tap(() => parseQueue.shift()),
		filter(() => parseQueue.length > 0),
		filter(() => parseQueue[0].length > 0),
		map(() => actions.parseNpx.started(parseQueue[0]))
	);

const loadNotepadByIndex$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.loadNotepadByIndex.type),
		map(action => (action as MicroPadActions['loadNotepadByIndex']).payload),
		filter(index => !!(state$.value as IStoreState).notepads && (state$.value as IStoreState).notepads.savedNotepadTitles!.length >= index),
		map((index: number) => (state$.value as IStoreState).notepads.savedNotepadTitles![index - 1]),
		map((title: string) => actions.openNotepadFromStorage.started(title))
	);

const updateSyncedNotepadIdOnSyncListLoad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.getSyncedNotepadList.done.type),
		map(action => actions.updateCurrentSyncId((action as MicroPadActions['getSyncedNotepadList']['done']).payload.result))
	);

const saveNotepadOnCreation$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.newNotepad.type),
		map(() => state$.value.notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),
		map((notepad: FlatNotepad) => notepad.toNotepad()),
		map((notepad: Notepad) => actions.saveNotepad.started(notepad))
	);

const quickNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.quickNote.started.type),
		map(() => state$.value.notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),
		throttleTime(1000),
		map(() => generateGuid()),
		map(guid => actions.quickNote.done({ params: undefined, result: guid }))
	);

const loadQuickNote$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.quickNote.done.type),
		map(action => (action as MicroPadActions['quickNote']['done']).payload.result),
		map((ref: string) => actions.loadNote.started(ref))
	);

const quickNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.quickNotepad.type),
		map(() => {
			let notepad = new FlatNotepad(`Untitled Notepad (${format(new Date(), 'EEEE, d LLLL yyyy pp')})`);
			let section = FlatNotepad.makeFlatSection('Unorganised Notes');
			let note = new Note('Untitled Note').clone({ parent: section.internalRef });

			return notepad.addSection(section).addNote(note);
		}),
		map(notepad => actions.newNotepad(notepad))
	);

const autoFillNewNotepads$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.newNotepad.type),
		map(action => (action as MicroPadActions['newNotepad']).payload),
		concatMap((notepad: FlatNotepad) => {
			const noteRef = Object.values(notepad.notes)[0].internalRef;
			return [
				actions.loadNote.started(noteRef),
				actions.toggleInsertMenu({
					enabled: true,
					x: 10,
					y: 10
				})
			];
		})
	);

const moveObjAcrossNotepads$ = (actions$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	actions$.pipe(
		ofType(actions.moveObjAcrossNotepads.started.type),
		map(action => action as MicroPadActions['moveObjAcrossNotepads']['started']),
		switchMap(action => from(getStorage().notepadStorage.getItem<string>(action.payload.newNotepadTitle)).pipe(
			switchMap(notepadShellJson => {
				if (!notepadShellJson) throw new Error('No notepad found with that name');
				const shell: NotepadShell = JSON.parse(notepadShellJson);

				return from(fromShell(
					shell,
					state$.value.notepadPasskeys[action.payload.newNotepadTitle]
				));
			}),
			map((decryptedShell): [EncryptNotepadAction, RestructuredNotepads] => {
				const payload = action.payload;
				const destNotepad = decryptedShell.notepad.flatten();

				switch (payload.type) {
					case MoveAcrossNotepadsObjType.SECTION:
						return [decryptedShell, moveSection(payload.internalRef, payload.oldNotepad, destNotepad)];
					case MoveAcrossNotepadsObjType.NOTE:
						return [decryptedShell, moveNote(payload.internalRef, payload.oldNotepad, destNotepad)];
					default:
						throw unreachable();
				}
			}),
			concatMap(([decryptedShell, movedNotepads]: [EncryptNotepadAction, RestructuredNotepads]) => {
				return [
					actions.addCryptoPasskey({
						notepadTitle: decryptedShell.notepad.title,
						passkey: decryptedShell.passkey,
						remember: decryptedShell.rememberKey
					}),
					actions.parseNpx.done({
						params: '',
						result: movedNotepads.source
					}),
					actions.parseNpx.done({
						params: '',
						result: movedNotepads.destination
					}),
					actions.moveObjAcrossNotepads.done({ params: action.payload, result: undefined })
				];
			}),
			catchError(error => of(actions.moveObjAcrossNotepads.failed({ params: action.payload, error })))
		))
	);

const moveObjAcrossNotepadsFailure$ = (actions$: Observable<MicroPadAction>) =>
	actions$.pipe(
		ofType(actions.moveObjAcrossNotepads.failed.type),
		tap(action => {
			console.error(`Error moving notepad object: ${action}`);
			Dialog.alert(`There was an error moving this ${(action as MicroPadActions['moveObjAcrossNotepads']['failed']).payload.params.type}`);
		}),
		noEmit()
	);

const warnOnReadOnlyEdit$ = (actions$: Observable<MicroPadAction>, state$: EpicStore, { getToastEventHandler, notificationService }: EpicDeps) =>
	actions$.pipe(
		filter(() => !!state$.value.notepads.notepad?.isReadOnly),
		filter(action => READ_ONLY_ACTIONS.has(action.type)),
		tap(() => {
			notificationService.dismissToasts();
			const guid = getToastEventHandler().register(async () => {
				const newTitle = await Dialog.prompt('New Title:');
				if (!newTitle) return;

				STORE.dispatch(actions.renameNotepad.started(newTitle));
			})

			notificationService.toast({
				html: `This notepad is read-only. Changes will not be saved.<br />` +
					`Please create a notebook or open another one using the notebooks dropdown if you want to edit a notebook.<br />` +
					`If you have made changes to this notebook, you can make it editable by renaming it.<br />` +
					`<a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.toastEvent('${guid}');">RENAME</a>`,
				displayLength: 10_000
			});
		}),
		noEmit()
	)

export const notepadEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	parseNpx$,
	syncOnNotepadParsed$,
	restoreJsonNotepad$,
	restoreJsonNotepadAndLoadNote$,
	exportNotepad$,
	exportAll$,
	exportAllDone$,
	renameNotepad$,
	saveNotepadOnRenameOrNew$,
	exportAllToMarkdown$,
	downloadExternalNotepad$,
	queueParseNpx$,
	getNextParse$,
	parseEnex$,
	parseMarkdownImport$,
	loadNotepadByIndex$,
	updateSyncedNotepadIdOnSyncListLoad$,
	saveNotepadOnCreation$,
	quickNote$,
	loadQuickNote$,
	quickNotepad$,
	autoFillNewNotepads$,
	moveObjAcrossNotepads$,
	moveObjAcrossNotepadsFailure$,
	warnOnReadOnlyEdit$
);

interface IExportedNotepad {
	title: string;
	content: string | MarkdownNote[];
}

async function getNotepadXmlWithAssets(notepad: Notepad): Promise<IExportedNotepad> {
	const assets = await getAssets(notepad.notepadAssets);
	return { title: notepad.title, content: await notepad.clone({ assets }).toXml() };
}

async function getNotepadMarkdownWithAssets(notepad: Notepad): Promise<IExportedNotepad> {
	const assets = await getAssets(notepad.notepadAssets);
	return { title: notepad.title, content: await notepad.toMarkdown(assets) };
}

export async function getAssets(notepadAssets: string[]): Promise<Asset[]> {
	const resolvedAssets: Array<Asset | null> = await Promise.all(notepadAssets.map(uuid =>
		ASSET_STORAGE.getItem<Blob>(uuid)
			.then(blob => {
				if (!blob) return null;
				return new Asset(blob, uuid);
			})
			.catch(e => {
				console.warn('skipping asset in export because: ', e);
				return null;
			})
	));

	return resolvedAssets.filter((asset): asset is Asset => !!asset);
}
