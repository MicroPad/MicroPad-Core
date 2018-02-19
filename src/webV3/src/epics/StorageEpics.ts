import { combineEpics } from 'redux-observable';
import { filter, switchMap } from 'rxjs/operators';
import { actions } from '../actions';
import { Action, isType } from 'redux-typescript-actions';
import { empty } from 'rxjs/observable/empty';
import { INotepad } from '../types/NotepadTypes';

const saveOnParse$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<{params: string, result: INotepad}>) => isType(action, actions.parseNpx.done)),
		switchMap((action: Action<{params: string, result: INotepad}>) => {
			store.dispatch();
			const notepad: INotepad = action.payload.result;

			return empty();
		})
	);

export const storageEpics$ = combineEpics(
	saveOnParse$
);
