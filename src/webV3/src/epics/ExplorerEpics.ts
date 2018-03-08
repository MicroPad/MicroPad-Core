import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepad, INotepadStoreState } from '../types/NotepadTypes';

const expandAll$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.expandAllExplorer.started)),
		map(() => (store.getState().notepads.notepad || <INotepadStoreState> {}).item),
		filter(Boolean),
		// map((notepad: INotepad) => ),
		map(() => actions.expandAllExplorer.done({ params: undefined, result: undefined }))
	);

export const explorerEpics$ = combineEpics(
	expandAll$
);