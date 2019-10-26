import { actions } from '../../core/actions';
import {
	catchError, combineLatest,
	concatMap,
	filter,
	map,
	mergeMap,
	retry,
	switchMap,
	take,
	tap,
	throttleTime,
	withLatestFrom
} from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { INotepadsStoreState, INotepadStoreState } from '../../core/types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '..';
import { IStoreState } from '../../core/types';
import saveAs from 'save-as';
import * as JSZip from 'jszip';
import { filterTruthy, fixFileName, generateGuid, isAction } from '../util';
import { Dialog } from '../dialogs';
import { CombinedNotepadSyncList, ISyncedNotepad, SyncUser } from '../../core/types/SyncTypes';
import { Asset, FlatNotepad, Note, Notepad, Translators } from 'upad-parse/dist';
import { MarkdownNote } from 'upad-parse/dist/Note';
import { from, Observable, of } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { RestoreJsonNotepadAndLoadNoteAction } from '../../core/types/ActionTypes';
import { format } from 'date-fns';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { fromShell } from '../CryptoService';
import { EpicDeps } from './index';

const parseQueue: string[] = [];

const parseNpx$ = (action$: Observable<Action<string>>) =>
	action$.pipe(
		isAction(actions.parseNpx.started),
		switchMap((action: Action<string>) =>
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

const syncOnNotepadParsed$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.updateCurrentSyncId),
		switchMap(() => state$.pipe(take(1))),
		map((state: IStoreState) => state.notepads.notepad),
		filter((npState: INotepadStoreState) => !!npState && !!npState.item),
		map((npState: INotepadStoreState) => actions.actWithSyncNotepad({
			notepad: (npState.item!).toNotepad(),
			action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId: npState.activeSyncId! })
		}))
	);

const parseEnex$ = action$ =>
	action$.pipe(
		isAction(actions.parseEnex),
		switchMap((action: Action<string>) =>
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

const parseMarkdownImport$ = (action$: Observable<Action<Translators.Markdown.MarkdownImport[]>>) =>
	action$.pipe(
		isAction(actions.importMarkdown),
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
		filterTruthy(),
		map((np: Notepad) => actions.parseNpx.done({ params: '', result: np.flatten() }))
	);

const restoreJsonNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.restoreJsonNotepad)),
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
				Dialog.alert(`Error restoring notepad`);
				console.error(err);
				return [actions.parseNpx.failed({
					params: '',
					error: err
				})];
			}
		})())),
		mergeMap((restoreActions: Action<any>[]) => [...restoreActions])
	);

const restoreJsonNotepadAndLoadNote$ = (action$, state$: Observable<IStoreState>, { getStorage }: EpicDeps) =>
	action$.pipe(
		isAction(actions.restoreJsonNotepadAndLoadNote),
		map((action: Action<RestoreJsonNotepadAndLoadNoteAction>) => action.payload),
		switchMap((result: RestoreJsonNotepadAndLoadNoteAction) =>
			from((getStorage().notepadStorage as LocalForage).getItem(result.notepadTitle)).pipe(
				withLatestFrom(state$),
				switchMap(([notepadJson, state]: [string, IStoreState]) =>
					from(Translators.Json.toFlatNotepadFromNotepad(
						notepadJson,
						state.notepadPasskeys[result.notepadTitle]
					))
				),
				map((notepad: FlatNotepad) => [result.noteRef, notepad]),
				catchError(err => {
					console.error(err);
					Dialog.alert(`Error opening notepad`);
					return of(null);
				})
			)
		),
		filterTruthy(),
		concatMap(([noteRef, notepad]: [string, FlatNotepad]) => [
			actions.parseNpx.done({ params: '', result: notepad }),
			actions.loadNote.started(noteRef)
		])
	);

const exportNotepad$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportNotepad)),
		switchMap(() => state$.pipe(take(1))),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => (state.notepad || <INotepadStoreState> {}).item),
		filterTruthy(),
		switchMap((notepad: FlatNotepad) =>
			from(getNotepadXmlWithAssets(notepad.toNotepad()))
		),
		tap((exportedNotepad: IExportedNotepad) => {
			const blob = new Blob([exportedNotepad.content as BlobPart], { type: 'text/xml;charset=utf-8' });
			saveAs(blob, `${fixFileName(exportedNotepad.title)}.npx`);
		}),
		filter(() => false)
	);

const exportAll$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportAll.started)),
		switchMap(() => state$.pipe(take(1))),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filterTruthy(),
		withLatestFrom(state$),
		switchMap(([titles, state]: [string[], IStoreState]) => {
			const notepadsInStorage: Promise<string>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return from(Promise.all(notepadsInStorage)).pipe(
				switchMap((notepads: string[]) => {
					const pendingXml = notepads.map(async (notepadJSON: string) => {
						const shell: NotepadShell = JSON.parse(notepadJSON);

						const notepad = (await fromShell(shell, state.notepadPasskeys[shell.title])).notepad;
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

const exportAllToMarkdown$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportToMarkdown.started)),
		switchMap(() => state$.pipe(take(1))),
		map((state: IStoreState) => state.notepads),
		filterTruthy(),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filterTruthy(),
		withLatestFrom(state$),
		switchMap(([titles, state]: [string[], IStoreState]) => {
			const notepadsInStorage: Promise<string>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return from(Promise.all(notepadsInStorage)).pipe(
				switchMap((notepads: string[]) => {
					const pendingContent = notepads.map(async (notepadJSON: string) => {
						const shell: NotepadShell = JSON.parse(notepadJSON);

						const notepad = (await fromShell(shell, state.notepadPasskeys[shell.title])).notepad;
						return await getNotepadMarkdownWithAssets(notepad);
					});

					return from(Promise.all(pendingContent));
				}),
				switchMap((exportNotepads: IExportedNotepad[]) => {
					const zip: JSZip = new JSZip();

					exportNotepads.forEach((exportedNotepad: IExportedNotepad) => {
						(<MarkdownNote[]> exportedNotepad.content).forEach(mdNote =>
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

const exportAllDone$ = (action$: Observable<Action<Success<void, Blob>>>) =>
	action$.pipe(
		isAction(actions.exportAll.done, actions.exportToMarkdown.done),
		map((action: Action<Success<void, Blob>>) => action.payload.result),
		tap(zip => saveAs(zip, `notepads.zip`)),
		filter(() => false)
	);

const renameNotepad$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.renameNotepad.started)),
		switchMap((action: Action<string>) => state$.pipe(
			take(1),
			switchMap(state => {
				const oldTitle = state.notepads.notepad!.item!.title;

				return from(NOTEPAD_STORAGE.removeItem(oldTitle))
					.pipe(
						map(() => { return { newTitle: action.payload, oldTitle }; })
					);
			}),
			map((res: {newTitle: string, oldTitle: string}) => actions.renameNotepad.done({params: res.newTitle, result: res.oldTitle}))
		))
	);

const saveNotepadOnRenameOrNew$ = (action$, state$: Observable<IStoreState>) =>
	action$
		.pipe(
			filter((action: Action<Success<any, any>>) => isType(action, actions.renameNotepad.done) || isType(action, actions.parseNpx.done)),
			switchMap(() => state$.pipe(
				take(1),
				map(state => state.notepads.notepad),
				filterTruthy(),
				map(notepadState => notepadState.item),
				filterTruthy(),
				map((notepad: FlatNotepad) => actions.saveNotepad.started(notepad.toNotepad()))
			))
		);

const downloadExternalNotepad$ = action$ =>
	action$.pipe(
		isAction(actions.downloadNotepad.started),
		map((action: Action<string>) => action.payload),
		switchMap(url => of(url).pipe(
			combineLatest(from(Dialog.confirm(`Are you sure you want to download this notepad: ${url}?`)))
		)),
		filter(([, shouldDownload]: [string, boolean]) => shouldDownload),
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

const queueParseNpx$ = action$ =>
	action$.pipe(
		isAction(actions.queueParseNpx),
		map((action: Action<string>) => action.payload),
		tap((xml: string) => {
			if (parseQueue.length > 0) parseQueue.push(xml);
		}),
		filter(() => parseQueue.length === 0),
		tap(() => parseQueue.push('')),
		map((xml: string) => actions.parseNpx.started(xml))
	);

const getNextParse$ = action$ =>
	action$.pipe(
		isAction(actions.parseNpx.done),
		tap(() => parseQueue.shift()),
		filter(() => parseQueue.length > 0),
		filter(() => parseQueue[0].length > 0),
		map(() => actions.parseNpx.started(parseQueue[0]))
	);

const loadNotepadByIndex$ = (action$: Observable<Action<number>>, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.loadNotepadByIndex),
		map((action: Action<number>) => action.payload),
		switchMap(index => state$.pipe(
			take(1),
			filter(state => !!state.notepads && state.notepads.savedNotepadTitles!.length >= index),
			map(state => state.notepads.savedNotepadTitles![index - 1]),
			map((title: string) => actions.openNotepadFromStorage.started(title))
		))
	);

const updateSyncedNotepadIdOnSyncListLoad$ = action$ =>
	action$.pipe(
		isAction(actions.getSyncedNotepadList.done),
		map((action: Action<Success<SyncUser, CombinedNotepadSyncList>>) => actions.updateCurrentSyncId(action.payload.result))
	);

const saveNotepadOnCreation$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.newNotepad),
		switchMap(() => state$.pipe(
			take(1),
			map(state => state.notepads.notepad),
			filterTruthy(),
			map((notepadState: INotepadStoreState) => notepadState.item),
			filterTruthy(),
			map((notepad: FlatNotepad) => notepad.toNotepad()),
			map((notepad: Notepad) => actions.saveNotepad.started(notepad))
		))
	);

const quickNote$ = (action$: Observable<Action<void>>, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.quickNote.started),
		switchMap(() => state$.pipe(
			take(1),
			map(state => state.notepads.notepad),
			filterTruthy(),
			map((notepadState: INotepadStoreState) => notepadState.item),
			filterTruthy(),
			throttleTime(1000),
			map(() => generateGuid()),
			map(guid => actions.quickNote.done({ params: undefined, result: guid}))
		)),
	);

const loadQuickNote$ = (action$: Observable<Action<Success<void, string>>>) =>
	action$.pipe(
		isAction(actions.quickNote.done),
		map(action => action.payload.result),
		map((ref: string) => actions.loadNote.started(ref))
	);

const quickNotepad$ = (action$: Observable<Action<void>>) =>
	action$.pipe(
		isAction(actions.quickNotepad),
		map(() => {
			let notepad = new FlatNotepad(`Untitled Notepad (${format(new Date(), 'dddd, D MMMM YYYY h:mm:ss A')})`);
			let section = FlatNotepad.makeFlatSection('Unorganised Notes');
			let note = new Note('Untitled Note').clone({ parent: section.internalRef });

			return notepad.addSection(section).addNote(note);
		}),
		map(notepad => actions.newNotepad(notepad))
	);

const autoFillNewNotepads$ = (action$: Observable<Action<FlatNotepad>>) =>
	action$.pipe(
		isAction(actions.newNotepad),
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

export const notepadEpics$ = combineEpics(
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
	autoFillNewNotepads$
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

		const resolvedAssets: Promise<Blob>[] = [];
		for (let uuid of notepadAssets) {
			resolvedAssets.push(ASSET_STORAGE.getItem(uuid));
		}

		Promise.all(resolvedAssets)
			.then((blobs: Blob[]) => {
				blobs.forEach((blob: Blob, i: number) => {
					assets.push(new Asset(blob, notepadAssets[i]));
				});

				resolve(assets);
			});
	});
}
