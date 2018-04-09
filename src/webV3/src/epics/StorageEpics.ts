import { actions } from '../actions';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { INotepad, INotepadStoreState } from '../types/NotepadTypes';
import { NOTEPAD_STORAGE } from '../index';
import { IStoreState } from '../types';
import { format } from 'date-fns';
import * as stringify from 'json-stringify-safe';

let currentNotepadTitle = '';

const saveNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<INotepad>) => isType(action, actions.saveNotepad.started)),
		map((action: Action<INotepad>) => action.payload),
		switchMap((notepad: INotepad) => Observable.fromPromise(NOTEPAD_STORAGE.setItem(notepad.title, stringify(notepad)))),
		catchError(err => Observable.of(actions.saveNotepad.failed({ params: <INotepad> {}, error: err }))),
		map(() => actions.saveNotepad.done({ params: <INotepad> {}, result: undefined }))
	);

const saveOnChanges$ = (action$, store) =>
	action$.pipe(
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads.notepad),
		filter(Boolean),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filter(Boolean),
		debounceTime(1000),
		distinctUntilChanged(),
		filter((notepad: INotepad) => {
			const condition = notepad.title === currentNotepadTitle;
			currentNotepadTitle = notepad.title;

			return condition;
		}),
		map((notepad: INotepad) => {
			return actions.saveNotepad.started(notepad);
		})
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

const deleteNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.deleteNotepad)),
		map((action: Action<string>) => action.payload),
		tap((notepadTitle: string) => Observable.fromPromise(NOTEPAD_STORAGE.removeItem(notepadTitle))),
		map(() => actions.empty(undefined))
	);

export const storageEpics$ = combineEpics(
	saveNotepad$,
	getNotepadList$,
	openNotepadFromStorage$,
	deleteNotepad$,
	saveOnChanges$
);
