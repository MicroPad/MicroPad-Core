import { actions } from '../actions';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/dist/index.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { IAssets, INotepad } from '../types/NotepadTypes';
import { ASSET_STORAGE } from '../index';

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

export const notepadEpics$ = combineEpics(
	parseNpx$,
	restoreJsonNotepad$
);
