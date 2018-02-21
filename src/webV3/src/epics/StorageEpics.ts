import { actions } from '../actions';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { INotepad } from '../types/NotepadTypes';
import { stringify } from '../util';
import { NOTEPAD_STORAGE } from '../index';

const saveOnParse$ = action$ =>
	action$.pipe(
		filter((action: Action<Success<string, INotepad>>) => isType(action, actions.parseNpx.done)),
		map((action: Action<Success<string, INotepad>>) => action.payload.result),
		switchMap((notepad: INotepad) => Observable.fromPromise(NOTEPAD_STORAGE.setItem(notepad.title, stringify(notepad)))),
		catchError(err => Observable.of(actions.saveNotepad.failed({ params: 0, error: err }))),
		map(() => actions.saveNotepad.done({ params: 0, result: 0 }))
	);

const getNotepadList$ = action$ =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.getNotepadList.started)),
		switchMap(() => Observable.fromPromise(NOTEPAD_STORAGE.keys())),
		catchError(err => Observable.of(actions.getNoteapdList.failed({ params: 0, error: err }))),
		map((keys: string[]) => {
			return actions.getNotepadList.done({ params: 0, result: keys });
		})
	);

export const storageEpics$ = combineEpics(
	saveOnParse$,
	getNotepadList$
);
