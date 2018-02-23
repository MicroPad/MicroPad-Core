import { actions } from '../actions';
import { catchError, filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { INotepad } from '../types/NotepadTypes';
import { stringify } from '../util';
import { NOTEPAD_STORAGE } from '../index';

const saveNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<INotepad>) => isType(action, actions.saveNotepad.started)),
		map((action: Action<INotepad>) => action.payload),
		switchMap((notepad: INotepad) => Observable.fromPromise(NOTEPAD_STORAGE.setItem(notepad.title, stringify(notepad)))),
		catchError(err => Observable.of(actions.saveNotepad.failed({ params: <INotepad> {}, error: err }))),
		map(() => actions.saveNotepad.done({ params: <INotepad> {}, result: undefined }))
	);

const getNotepadList$ = action$ =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.getNotepadList.started)),
		switchMap(() => Observable.fromPromise(NOTEPAD_STORAGE.keys())),
		catchError(err => Observable.of(actions.getNotepadList.failed({ params: undefined, error: err }))),
		map((keys: string[]) => {
			return actions.getNotepadList.done({ params: undefined, result: keys });
		})
	);

const openNotepadFromStorage$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.openNotepadFromStorage.started)),
		map((action: Action<string>) => action.payload),
		switchMap((notepadTitle: string) => Observable.fromPromise(NOTEPAD_STORAGE.getItem(notepadTitle))),
		catchError(err => {
			alert(`Error opening notepad`);
			return Observable.of(actions.openNotepadFromStorage.failed(err));
		}),
		mergeMap((json: string) => [
			actions.openNotepadFromStorage.done({ params: '', result: undefined }),
			actions.restoreJsonNotepad(json)
		])
	);

export const storageEpics$ = combineEpics(
	saveNotepad$,
	getNotepadList$,
	openNotepadFromStorage$
);
