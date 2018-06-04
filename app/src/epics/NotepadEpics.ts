import { actions } from '../actions';
import { catchError, combineLatest, filter, map, mergeMap, retry, switchMap, tap } from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/dist/index.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import {
	IAsset,
	IAssets,
	IMarkdownNote,
	INotepad,
	INotepadsStoreState,
	INotepadStoreState
} from '../types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '../index';
import { IStoreState } from '../types';
import saveAs from 'save-as';
import * as JSZip from 'jszip';
import { isAction } from '../util';
import { ajax } from 'rxjs/observable/dom/ajax';
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable';
import { Dialog } from '../dialogs';
import { of } from 'rxjs/observable/of';
import { ISyncedNotepad, SyncedNotepadList, SyncUser } from '../types/SyncTypes';

const parseQueue: string[] = [];

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		switchMap((action: Action<string>) => {
			return fromPromise(new Promise((resolve, reject) => {
				try {
					Parser.parse(action.payload, ['asciimath']);
				} catch (err) {
					Dialog.alert(`Error reading file`);
					console.error(err);
					reject(err);
					return;
				}

				const notepad: INotepad = Parser.notepad;

				// Sort out assets
				try {
					Parser.parseAssets(action.payload, async (assets: IAssets) => {
						const notepadAssets = new Set((notepad.notepadAssets || []));
						for (let i = 0; i < assets.assets.length; i++) {
							if (!notepadAssets.has(assets.assets[i].uuid)) notepadAssets.add(assets.assets[i].uuid);
							await ASSET_STORAGE.setItem(assets.assets[i].uuid, assets.assets[i].data);
						}

						notepad.notepadAssets = Array.from(notepadAssets);
						resolve(notepad);
					});
				} catch (err) {
					Dialog.alert(`Error reading file`);
					console.error(err);
					reject(err);
				}
			}))
				.pipe(
					map((notepad: INotepad) => actions.parseNpx.done({ params: '', result: notepad })),
					catchError(err => Observable.of(actions.parseNpx.failed({ params: '', error: err })))
				);
		})
	);

const syncOnNotepadParsed$ = (action$, store) =>
	action$.pipe(
		isAction(actions.updateCurrentSyncId),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads.notepad),
		filter((npState: INotepadStoreState) => !!npState && !!npState.item),
		map((npState: INotepadStoreState) => actions.actWithSyncNotepad({ notepad: npState.item!, action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId: npState.activeSyncId! }) }))
	);

const parseEnex$ = action$ =>
	action$.pipe(
		isAction(actions.parseEnex),
		map((action: Action<string>) => action.payload),
		map((enex: string) => {
			try {
				Parser.parseFromEvernote(enex, ['asciimath']);
			} catch (err) {
				Dialog.alert(`Error reading file`);
				console.error(err);
				return;
			}

			const notepad: INotepad = Parser.notepad;
			notepad.notepadAssets = [];

			return notepad;
		}),
		filter(Boolean),
		map((notepad: INotepad) => actions.parseNpx.done({ params: '', result: notepad }))
	);

const restoreJsonNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.restoreJsonNotepad)),
		map((action: Action<string>) => action.payload),
		map((json: string) => {
			try {
				const res = JSON.parse(json);
				const notepad: INotepad = Parser.restoreNotepad(res);
				notepad.notepadAssets = res.notepadAssets;

				return actions.parseNpx.done({
					params: '',
					result: notepad
				});
			} catch (err) {
				Dialog.alert(`Error restoring notepad`);
				console.error(err);
				return actions.parseNpx.failed({
					params: '',
					error: err
				});
			}
		})
	);

const exportNotepad$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportNotepad)),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads),
		filter(Boolean),
		map((state: INotepadsStoreState) => (state.notepad || <INotepadStoreState> {}).item),
		filter(Boolean),
		switchMap((notepad: INotepad) =>
			Observable.fromPromise(getNotepadXmlWithAssets(notepad))
		),
		tap((exportedNotepad: IExportedNotepad) => {
			const blob = new Blob([exportedNotepad.content], { type: 'text/xml;charset=utf-8' });
			saveAs(blob, `${exportedNotepad.title}.npx`);
		}),
		filter(() => false)
	);

const exportAll$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportAll)),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads),
		filter(Boolean),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filter(Boolean),
		switchMap((titles: string[]) => {
			const notepadsInStorage: Promise<string>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return Observable.fromPromise(Promise.all(notepadsInStorage));
		}),
		switchMap((notepads: string[]) => {
			const pendingXml: Promise<IExportedNotepad>[] = [];
			notepads.forEach((notepadJSON: string) => {
				const res = JSON.parse(notepadJSON);
				const notepad: INotepad = Parser.restoreNotepad(res);
				notepad.notepadAssets = res.notepadAssets;

				pendingXml.push(getNotepadXmlWithAssets(notepad));
			});

			return Observable.fromPromise(Promise.all(pendingXml));
		}),
		tap((exportNotepads: IExportedNotepad[]) => {
			const zip: JSZip = new JSZip();

			exportNotepads.forEach((exportedNotepad: IExportedNotepad) => {
				const blob: Blob = new Blob([exportedNotepad.content], { type: 'text/xml;charset=utf-8' });
				zip.file(`${exportedNotepad.title}.npx`, blob);
			});

			zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE'
			}).then((blob: Blob) => {
				saveAs(blob, `notepads.zip`);
			});
		}),
		filter(() => false)
	);

const exportAllToMarkdown$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.exportToMarkdown)),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads),
		filter(Boolean),
		map((state: INotepadsStoreState) => state.savedNotepadTitles),
		filter(Boolean),
		switchMap((titles: string[]) => {
			const notepadsInStorage: Promise<string>[] = [];
			titles.forEach((title: string) => notepadsInStorage.push(NOTEPAD_STORAGE.getItem(title)));

			return Observable.fromPromise(Promise.all(notepadsInStorage));
		}),
		switchMap((notepads: string[]) => {
			const pendingContent: Promise<IExportedNotepad>[] = [];
			notepads.forEach((notepadJSON: string) => {
				const res = JSON.parse(notepadJSON);
				const notepad: INotepad = Parser.restoreNotepad(res);
				notepad.notepadAssets = res.notepadAssets;

				pendingContent.push(getNotepadMarkdownWithAssets(notepad));
			});

			return Observable.fromPromise(Promise.all(pendingContent));
		}),
		tap((exportNotepads: IExportedNotepad[]) => {
			const zip: JSZip = new JSZip();

			exportNotepads.forEach((exportedNotepad: IExportedNotepad) => {
				(<IMarkdownNote[]> exportedNotepad.content).forEach(mdNote =>
					zip.file(
						`${exportedNotepad.title}/${mdNote.title}.md`,
						new Blob([mdNote.md], { type: 'text/markdown;charset=utf-8' })
					)
				);
			});

			zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE'
			}).then((blob: Blob) => {
				saveAs(blob, `notepads.zip`);
			});
		}),
		filter(() => false)
	);

const renameNotepad$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.renameNotepad.started)),
		switchMap((action: Action<string>) => {
			const oldTitle = store.getState().notepads.notepad.item.title;

			return Observable.fromPromise(NOTEPAD_STORAGE.removeItem(oldTitle))
				.pipe(
					map(() => { return { newTitle: action.payload, oldTitle }; })
				);
		}),
		map((res: {newTitle: string, oldTitle: string}) => actions.renameNotepad.done({params: res.newTitle, result: res.oldTitle}))
	);

const saveNotepadOnRenameOrNew$ = (action$, store) =>
	action$
		.pipe(
			filter((action: Action<Success<any, any>>) => isType(action, actions.renameNotepad.done) || isType(action, actions.parseNpx.done)),
			map(() => store.getState().notepads.notepad.item),
			map((notepad: INotepad) => actions.saveNotepad.started(notepad))
		);

const downloadExternalNotepad$ = action$ =>
	action$.pipe(
		isAction(actions.downloadNotepad.started),
		map((action: Action<string>) => action.payload),
		switchMap(url => of(url).pipe(
			combineLatest(fromPromise(Dialog.confirm(`Are you sure you want to download this notepad: ${url}?`)))
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
					return Observable.of(actions.downloadNotepad.failed({ params: url, error: err }));
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

const loadNotepadByIndex$ = (action$, store) =>
	action$.pipe(
		isAction(actions.loadNotepadByIndex),
		map((action: Action<number>) => action.payload),
		filter(index => !!(<IStoreState> store.getState()).notepads && (<IStoreState> store.getState()).notepads.savedNotepadTitles!.length >= index),
		map((index: number) => (<IStoreState> store.getState()).notepads.savedNotepadTitles![index - 1]),
		map((title: string) => actions.openNotepadFromStorage.started(title))
	);

const updateSyncedNotepadIdOnSyncListLoad$ = action$ =>
	action$.pipe(
		isAction(actions.getSyncedNotepadList.done),
		map((action: Action<Success<SyncUser, SyncedNotepadList>>) => actions.updateCurrentSyncId(action.payload.result))
	);

export const notepadEpics$ = combineEpics(
	parseNpx$,
	syncOnNotepadParsed$,
	restoreJsonNotepad$,
	exportNotepad$,
	exportAll$,
	renameNotepad$,
	saveNotepadOnRenameOrNew$,
	exportAllToMarkdown$,
	downloadExternalNotepad$,
	queueParseNpx$,
	getNextParse$,
	parseEnex$,
	loadNotepadByIndex$,
	updateSyncedNotepadIdOnSyncListLoad$
);

interface IExportedNotepad {
	title: string;
	content: string | IMarkdownNote[];
}

function getNotepadXmlWithAssets(notepad: INotepad): Promise<IExportedNotepad> {
	return new Promise<IExportedNotepad>((resolve, reject) => {
		try {
			getAssets(notepad.notepadAssets)
				.then((assets: IAssets) => notepad.toXML((xml: string) => {
					notepad.assets = new Parser.Assets();
					resolve({title: notepad.title, content: xml});
				}, assets))
				.catch((err) => reject(err));
		} catch (err) {
			reject(err);
		}
	});
}

function getNotepadMarkdownWithAssets(notepad: INotepad): Promise<IExportedNotepad> {
	return new Promise<IExportedNotepad>((resolve, reject) => {
		try {
			getAssets(notepad.notepadAssets)
				.then((assets: IAssets) => notepad.toMarkdown((md: IMarkdownNote[]) => {
					notepad.assets = new Parser.Assets();
					resolve({title: notepad.title, content: md});
				}, assets))
				.catch((err) => reject(err));
		} catch (err) {
			reject(err);
		}
	});
}

export function getAssets(notepadAssets: string[]): Promise<IAssets> {
	return new Promise<IAssets>(resolve => {
		const assets: IAssets = new Parser.Assets();

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
					let asset: IAsset = new Parser.Asset(blob);
					asset.uuid = notepadAssets[i];
					assets.addAsset(asset);
				});

				resolve(assets);
			});
	});
}
