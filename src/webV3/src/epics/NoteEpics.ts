import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INote, INotepad, INotepadStoreState } from '../types/NotepadTypes';
import { getNotepadObjectByRef } from '../util';

const loadNote$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.loadNote)),
		map((action: Action<string>) => [action.payload, (store.getState().notepads.notepad || <INotepadStoreState> {}).item]),
		filter(([ref, notepad]: [string, INotepad]) => !!ref && !!notepad),
		map(([ref, notepad]: [string, INotepad]) => {
			let note: INote | false = false;
			getNotepadObjectByRef(notepad, ref, obj => note = <INote> obj);

			return note;
		}),
		filter(Boolean),
		map((note: INote) => actions.expandFromNote(note))
	);

export const noteEpics$ = combineEpics(
	loadNote$
);
