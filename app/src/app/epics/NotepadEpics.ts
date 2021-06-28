import { actions, MicroPadAction, READ_ONLY_ACTIONS } from '../actions';
import {
	catchError,
	combineLatest,
	concatMap,
	filter,
	map,
	mergeMap,
	retry,
	switchMap,
	tap,
	throttleTime
} from 'rxjs/operators';
import { Action, Failure, Success } from 'redux-typescript-actions';
import { combineEpics, ofType } from 'redux-observable';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import saveAs from 'save-as';
import JSZip from 'jszip';
import { filterTruthy, fixFileName, generateGuid, noEmit, unreachable } from '../util';
import { Dialog } from '../services/dialogs';
import { CombinedNotepadSyncList, ISyncedNotepad, SyncUser } from '../types/SyncTypes';
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
import { ajax, AjaxResponse } from 'rxjs/ajax';
import {
	EncryptNotepadAction,
	MoveAcrossNotepadsAction,
	MoveAcrossNotepadsObjType,
	RestoreJsonNotepadAndLoadNoteAction
} from '../types/ActionTypes';
import { Dispatch } from 'redux';
import { format } from 'date-fns';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { DecryptionError, fromShell } from '../services/CryptoService';
import { ASSET_STORAGE, NOTEPAD_STORAGE, store as STORE } from '../root';
import { EpicDeps, EpicStore } from './index';

const parseQueue: string[] = [];

const parseNpx$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.parseNpx.started.type),
		switchMap(action =>
			from((async () => {
				let notepad: Notepad;
				try {
					notepad = await Translators.Xml.toNotepadFromNpx(action.payload);
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

const syncOnNotepadParsed$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<CombinedNotepadSyncList>>(actions.updateCurrentSyncId.type),
		map(() => store.getState()),
		map(state => state.notepads.notepad),
		filter((npState): npState is INotepadStoreState => !!npState && !!npState.item),
		map((npState: INotepadStoreState) => actions.actWithSyncNotepad({
			notepad: (npState.item!).toNotepad(),
			action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId: npState.activeSyncId! })
		}))
	);

const parseEnex$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.parseEnex.type),
		switchMap(action =>
			from((async () => {
				let notepad: Notepad;
				try {
					notepad = await Translators.Xml.toNotepadFromEnex(action.payload);
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
		ofType<MicroPadAction, Action<Translators.Markdown.MarkdownImport[]>>(actions.importMarkdown.type),
		map((action: Action<Translators.Markdown.MarkdownImport[]>) => action.payload),
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

const restoreJsonNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.restoreJsonNotepad.type),
		map((action: Action<string>) => action.payload),
		switchMap((json: string) => from((async () => {
			try {
				const shell: NotepadShell = JSON.parse(json);
				const res = await fromShell(shell);

				return [
					actions.addCryptoPasskey({
						notepadTitle: res.notepad.title,
						passkey: res.passkey
					}),
					actions.parseNpx.done({
						params: '',
						result: res.notepad.flatten()
					})
				];
			} catch (err) {
				if (err instanceof DecryptionError) {
					Dialog.alert(err.message);
				} else {
					Dialog.alert(`Error restoring notepad`);
				}

				console.error(err);
				return [actions.parseNpx.failed({
					params: '',
					error: err
				})];
			}
		})())),
		mergeMap((restoreActions: Action<any>[]) => [...restoreActions])
	);

const restoreJsonNotepadAndLoadNote$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }) =>
	action$.pipe(
		ofType<MicroPadAction, Action<RestoreJsonNotepadAndLoadNoteAction>>(actions.restoreJsonNotepadAndLoadNote.type),
		map(action => action.payload),
		switchMap(result =>
			from((getStorage().notepadStorage as LocalForage).getItem<string>(result.notepadTitle)).pipe(
				switchMap(notepadJson =>
					from(fromShell(JSON.parse(notepadJson!), store.getState().notepadPasskeys[result.notepadTitle]))
				),
				map(({ notepad, passkey }) => ({ notepad: notepad.flatten(), passkey })),
				map(({ notepad, passkey }): [string, FlatNotepad, string] => [result.noteRef, notepad, passkey]),
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
		concatMap(([noteRef, notepad, passkey]: [string, FlatNotepad, string]) => [
			actions.addCryptoPasskey({ notepadTitle: notepad.title, passkey }),
			actions.parseNpx.done({ params: '', result: notepad }),
			actions.loadNote.started(noteRef)
		])
	);

const exportNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<void>>(actions.exportNotepad.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => (state.notepad || {} as INotepadStoreState).item),
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

const exportAll$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<void>>(actions.exportAll.started.type),
		map(() => store.getState()),
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

						const notepad = (await fromShell(shell, store.getState().notepadPasskeys[shell.title])).notepad;
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

const exportAllToMarkdown$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<void>>(actions.exportToMarkdown.started.type),
		map(() => store.getState()),
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

						const notepad = (await fromShell(shell, store.getState().notepadPasskeys[shell.title])).notepad;
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
		ofType<MicroPadAction, Action<Success<void, Blob>>>(actions.exportAll.done.type, actions.exportToMarkdown.done.type),
		map((action: Action<Success<void, Blob>>) => action.payload.result),
		tap(zip => saveAs(zip, `notepads.zip`)),
		filter((_a): _a is never => false)
	);

const renameNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.renameNotepad.started.type),
		filter(() => !!store.getState().notepads.notepad?.item?.title),
		switchMap((action: Action<string>) => {
			const oldTitle = store.getState().notepads.notepad?.item?.title!;

			return from(NOTEPAD_STORAGE.removeItem(oldTitle))
				.pipe(
					map(() => { return { newTitle: action.payload, oldTitle }; })
				);
		}),
		map((res: { newTitle: string, oldTitle: string }) => actions.renameNotepad.done({ params: res.newTitle, result: res.oldTitle }))
	);

const saveNotepadOnRenameOrNew$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.renameNotepad.done.type, actions.parseNpx.done.type),
		map(() => store.getState().notepads.notepad?.item),
		filterTruthy(),
		map(notepad => actions.saveNotepad.started(notepad.toNotepad()))
	);

const downloadExternalNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.downloadNotepad.started.type),
		map(action => action.payload),
		switchMap(url => of(url).pipe(
			combineLatest(from(Dialog.confirm(`Are you sure you want to download this notepad: ${url}?`)))
		)),
		filter(([url, shouldDownload]: [string, boolean]) => shouldDownload),
		map(([url]: [string, boolean]) => url),
		mergeMap((url: string) =>
			ajax({
				url,
				crossDomain: true,
				headers: {
					'Content-Type': 'text/plain; charset=UTF-8'
				},
				responseType: 'text'
			}).pipe(
				map((res: AjaxResponse) => actions.parseNpx.started(res.response)),
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
		ofType<MicroPadAction, Action<string>>(actions.queueParseNpx.type),
		map((action: Action<string>) => action.payload),
		tap((xml: string) => {
			if (parseQueue.length > 0) parseQueue.push(xml);
		}),
		filter(() => parseQueue.length === 0),
		tap(() => parseQueue.push('')),
		map((xml: string) => actions.parseNpx.started(xml))
	);

const getNextParse$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.parseNpx.done.type),
		tap(() => parseQueue.shift()),
		filter(() => parseQueue.length > 0),
		filter(() => parseQueue[0].length > 0),
		map(() => actions.parseNpx.started(parseQueue[0]))
	);

const loadNotepadByIndex$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<number>>(actions.loadNotepadByIndex.type),
		map((action: Action<number>) => action.payload),
		filter(index => !!(store.getState() as IStoreState).notepads && (store.getState() as IStoreState).notepads.savedNotepadTitles!.length >= index),
		map((index: number) => (store.getState() as IStoreState).notepads.savedNotepadTitles![index - 1]),
		map((title: string) => actions.openNotepadFromStorage.started(title))
	);

const updateSyncedNotepadIdOnSyncListLoad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<SyncUser, CombinedNotepadSyncList>>>(actions.getSyncedNotepadList.done.type),
		map(action => actions.updateCurrentSyncId(action.payload.result))
	);

const saveNotepadOnCreation$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.newNotepad.type),
		map(() => store.getState().notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),
		map((notepad: FlatNotepad) => notepad.toNotepad()),
		map((notepad: Notepad) => actions.saveNotepad.started(notepad))
	);

const quickNote$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.quickNote.started.type),
		map(() => store.getState().notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),
		throttleTime(1000),
		map(() => generateGuid()),
		map(guid => actions.quickNote.done({ params: undefined, result: guid }))
	);

const loadQuickNote$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<void, string>>>(actions.quickNote.done.type),
		map(action => action.payload.result),
		map((ref: string) => actions.loadNote.started(ref))
	);

const quickNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<void>>(actions.quickNotepad.type),
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
		ofType<MicroPadAction, Action<FlatNotepad>>(actions.newNotepad.type),
		map(action => action.payload),
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

const moveObjAcrossNotepads$ = (actions$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	actions$.pipe(
		ofType<MicroPadAction, Action<MoveAcrossNotepadsAction>>(actions.moveObjAcrossNotepads.started.type),
		switchMap(action => from(getStorage().notepadStorage.getItem<string | undefined>(action.payload.newNotepadTitle)).pipe(
			switchMap(notepadShellJson => {
				if (!notepadShellJson) throw new Error('No notepad found with that name');
				const shell: NotepadShell = JSON.parse(notepadShellJson);

				return from(fromShell(
					shell,
					store.getState().notepadPasskeys[action.payload.newNotepadTitle]
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
						passkey: decryptedShell.passkey
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
		ofType<MicroPadAction, Action<Failure<MoveAcrossNotepadsAction, Error>>>(actions.moveObjAcrossNotepads.failed.type),
		tap(action => {
			console.error(`Error moving notepad object: ${action}`);
			Dialog.alert(`There was an error moving this ${action.payload.params.type}`);
		}),
		noEmit()
	);

const warnOnReadOnlyEdit$ = (actions$: Observable<MicroPadAction>, store: EpicStore, { getToastEventHandler, notificationService }: EpicDeps) =>
	actions$.pipe(
		filter(() => !!store.getState().notepads.notepad?.isReadOnly),
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

export const notepadEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	parseNpx$,
	syncOnNotepadParsed$ as any,
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

export function getAssets(notepadAssets: string[]): Promise<Asset[]> {
	return new Promise<Asset[]>(resolve => {
		const assets: Asset[] = [];

		if (!notepadAssets || notepadAssets.length === 0) {
			resolve(assets);
			return;
		}

		const resolvedAssets: Promise<Blob | null>[] = [];
		for (let uuid of notepadAssets) {
			resolvedAssets.push(ASSET_STORAGE.getItem(uuid));
		}

		Promise.all(resolvedAssets)
			.then((blobs: Array<Blob | null>) => {
				blobs
					.filter((blob): blob is Blob => !!blob)
					.forEach((blob: Blob, i: number) => assets.push(new Asset(blob, notepadAssets[i])));

				resolve(assets);
			});
	});
}
