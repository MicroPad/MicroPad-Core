import { actions } from '../actions';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/dist/index.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { IAssets, INotepad, INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '../index';
import { IStoreState } from '../types';
import saveAs from 'save-as';
import { getNotepadXmlWithAssets, IExportedNotepad } from '../util';
import * as JSZip from 'jszip';

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		switchMap((action: Action<string>) => {
			return fromPromise(new Promise((resolve, reject) => {
				try {
					Parser.parse(action.payload, ['asciimath']);
				} catch (err) {
					alert(`Error reading file`);
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
					alert(`Error reading file`);
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
				alert(`Error restoring notepad`);
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
			const blob = new Blob([exportedNotepad.xml], { type: 'text/xml;charset=utf-8' });
			saveAs(blob, `${exportedNotepad.title}.npx`);
		}),
		map(() => actions.empty(undefined))
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
				const blob: Blob = new Blob([exportedNotepad.xml], { type: 'text/xml;charset=utf-8' });
				zip.file(`${exportedNotepad.title}.npx`, blob);
			});

			zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE'
			}).then((blob: Blob) => {
				saveAs(blob, `notepads.zip`);
			});
		}),
		map(() => actions.empty(undefined))
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

const renameNotepadDone$ = (action$, store) =>
	action$
		.pipe(
			filter((action: Action<Success<string, string>>) => isType(action, actions.renameNotepad.done)),
			map(() => store.getState().notepads.notepad.item),
			map((notepad: INotepad) => actions.saveNotepad.started(notepad))
		);

export const notepadEpics$ = combineEpics(
	parseNpx$,
	restoreJsonNotepad$,
	exportNotepad$,
	exportAll$,
	renameNotepad$,
	renameNotepadDone$
);
