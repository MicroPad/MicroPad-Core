// @ts-ignore
import SearchWorker from '!workerize-loader!../../react-web/SearchWorker.js';

import { combineEpics } from 'redux-observable';
import { catchError, filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { HashTagSearchResult, HashTagSearchResults } from '../reducers/SearchReducer';
import { IStoreState } from '../types';
import { isAction, restoreObject } from '../../react-web/util';
import { SearchIndex, SearchIndices } from '../types/ActionTypes';
import { FlatNotepad, Trie } from 'upad-parse/dist';

export namespace SearchEpics {
	const searchWorker = new SearchWorker() as any;

	export const refreshIndices$ = action$ =>
		action$.pipe(
			isAction(actions.saveNotepad.done, actions.deleteNotepad),
			map(() => actions.indexNotepads.started(undefined))
		);

	export const indexNotepads$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.indexNotepads.started),
			switchMap(() => state$.pipe(
				take(1),
				map(state => ({
					indices: state.search.indices,
					notepadPasskeys: state.notepadPasskeys
				})),
				switchMap(({ indices, notepadPasskeys }) =>
					from(searchWorker.indexNotepads(indices, notepadPasskeys)).pipe(
						map((newIndices: SearchIndices) =>
							newIndices.map((index): SearchIndex => {
								// TODO: Deep restore the object, not just first level

								return {
									notepad: restoreObject<FlatNotepad>(index.notepad, new FlatNotepad('tmp')),
									trie: restoreObject<Trie>(index.trie, new Trie())
								};
							})
						),
						tap(a => console.log(a)),
						map(newIndices => actions.indexNotepads.done({ params: undefined, result: newIndices })),
						catchError(err => of(actions.indexNotepads.failed({ params: undefined, error: err })))
					)
				)
			))
		);

	export const search$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			filter((action: Action<string>) => isType(action, actions.search)),
			map((action: Action<string>) => action.payload),
			withLatestFrom(state$),
			switchMap(([query, state]: [string, IStoreState]) => from((async () => {
				if (query.length <= 1 || query.substring(0, 1) !== '#') return actions.displayHashTagSearchResults({});

				// Create a data structure with each notepad being the key to all the results for that hashtag's search
				const results: HashTagSearchResults = {};
				state.search.indices
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
}
