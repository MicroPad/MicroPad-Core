import { actions } from '../actions';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import { INotepad } from '../types/NotepadTypes';
import { stringify } from '../util';
import { NOTEPAD_STORAGE } from '../index';

const saveOnParse$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<Success<string, INotepad>>) => isType(action, actions.parseNpx.done)),
		map((action: Action<Success<string, INotepad>>) => action.payload.result),
		tap(() => store.dispatch(actions.saveNotepad.started(0))),
		switchMap((notepad: INotepad) => Observable.of(NOTEPAD_STORAGE.setItem(notepad.title, stringify(notepad)))),
		catchError(err => Observable.of(actions.saveNotepad.failed({ params: 0, error: err }))),
		map(() => actions.saveNotepad.done({ params: 0, result: 0 }))
	);

export const storageEpics$ = combineEpics(
	saveOnParse$
);
