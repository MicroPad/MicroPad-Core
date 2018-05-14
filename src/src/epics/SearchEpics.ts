import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { IStoreState } from '../types';

const search$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.search)),
		map((action: Action<string>) => action.payload),
		map((query: string) => {
			if (query.length <= 1 || query.substring(0, 1) !== '#') return actions.displayHashTagSearchResults([]);

			return actions.displayHashTagSearchResults(
				(<IStoreState> store.getState()).notepads!.notepad!.item!.search(query)
			);
		})
	);

export const searchEpics$ = combineEpics(
	search$
);
