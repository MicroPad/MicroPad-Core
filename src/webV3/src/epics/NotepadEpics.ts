import { actions } from '../actions';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/dist/index.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { IAsset, IAssets, INotepad, INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { ASSET_STORAGE } from '../index';
import { IStoreState } from '../types';
import saveAs from 'save-as';

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		switchMap((action: Action<string>) => {
			try {
				Parser.parse(action.payload, ['asciimath']);
			} catch (err) {
				alert(`Error reading file`);
				console.error(err);
				throw err;
			}

			return fromPromise(new Promise(resolve => {
				const notepad: INotepad = Parser.notepad;

				// Sort out assets
				Parser.parseAssets(action.payload, async (assets: IAssets) => {
					const notepadAssets = new Set((notepad.notepadAssets || []));
					for (let i = 0; i < assets.assets.length; i++) {
						if (!notepadAssets.has(assets.assets[i].uuid)) notepadAssets.add(assets.assets[i].uuid);
						await ASSET_STORAGE.setItem(assets.assets[i].uuid, assets.assets[i].data);
					}

					notepad.notepadAssets = Array.from(notepadAssets);
					resolve(notepad);
				});
			}));
		}),
		catchError(err => Observable.of(actions.parseNpx.failed({ params: '', error: err }))),
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
			Observable.fromPromise(getAssets(notepad.notepadAssets))
				.pipe(
					map((assets: IAssets) => [notepad, assets])
				)
		),
		tap(([notepad, assets]: [INotepad, IAssets]) => {
			notepad.toXML((xml: string) => {
				const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
				notepad.assets = new Parser.Assets();
				saveAs(blob, `${notepad.title}.npx`);
			}, assets);
		}),
		map(() => actions.empty(undefined))
	);

function getAssets(notepadAssets: string[]): Promise<IAssets> {
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

export const notepadEpics$ = combineEpics(
	parseNpx$,
	restoreJsonNotepad$,
	exportNotepad$
);
