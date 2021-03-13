import { combineEpics } from 'redux-observable';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { HashTagSearchResult, HashTagSearchResults } from '../reducers/SearchReducer';
import { IStoreState } from '../types';
import { Store } from 'redux';
import { SearchIndices } from '../types/ActionTypes';
import { isAction } from '../util';
import { indexNotepads } from '../workers/SearchWorker';

export const refreshIndices$ = action$ =>
	action$.pipe(
		isAction(actions.saveNotepad.done, actions.deleteNotepad),
		map(() => actions.indexNotepads.started(undefined))
	);

export const indexNotepads$ = (action$, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.indexNotepads.started),
		map(() => store.getState().search.indices),
		switchMap((indices: SearchIndices) =>
			from(indexNotepads(indices, store.getState().notepadPasskeys)).pipe(
				map(newIndices => actions.indexNotepads.done({ params: undefined, result: newIndices })),
				catchError(err => of(actions.indexNotepads.failed({ params: undefined, error: err })))
			)
		)
	);

export const search$ = (action$, store: Store<IStoreState>) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.search)),
		map((action: Action<string>) => action.payload),
		filter((query: string) => Object.keys(store.getState().search.hashTagResults).length > 0 || !(query.length <= 1 || query.substring(0, 1) !== '#')),
		switchMap((query: string) => from((async () => {
			if (query.length <= 1 || query.substring(0, 1) !== '#') return actions.displayHashTagSearchResults({});

			// Create a data structure with each notepad being the key to all the results for that hashtag's search
			const results: HashTagSearchResults = {};
			store.getState().search.indices
				.forEach(index =>
					index.notepad.search(index.trie, query)
						.map(note => {
							return {
								title: note.title,
								parentTitle: index.notepad.sections[note.parent as string].title,
								noteRef: note.internalRef
							} as HashTagSearchResult;
						})
						.forEach(result => results[index.notepad.title] = [
							...(results[index.notepad.title] || []),
							result
						])
				);

			// Search all of the notepads
			return actions.displayHashTagSearchResults(results);
		})()))
	);

export const searchEpics$ = combineEpics(
	refreshIndices$,
	indexNotepads$,
	search$
);
