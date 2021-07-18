import { combineEpics, ofType } from 'redux-observable';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action, Success } from 'redux-typescript-actions';
import { actions, MicroPadAction } from '../actions';
import { Dispatch } from 'redux';
import { SearchIndices } from '../types/ActionTypes';
import { EpicDeps, EpicStore } from './index';
import { Notepad } from 'upad-parse/dist';
import { flattenSearchResults, indexNotepads, RE_INIT_AUTOCOMPLETE$, search } from '../services/SearchService';
import { noEmit } from '../util';

export const refreshIndices$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<Notepad, void> | string>>(actions.saveNotepad.done.type, actions.deleteNotepad.type),
		map(() => actions.indexNotepads.started(undefined))
	);

export const indexNotepads$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.indexNotepads.started.type),
		map(() => store.getState().search.indices),
		switchMap((indices: SearchIndices) =>
			from(indexNotepads(indices, store.getState().notepadPasskeys)).pipe(
				map(newIndices => actions.indexNotepads.done({ params: undefined, result: newIndices })),
				catchError(err => of(actions.indexNotepads.failed({ params: undefined, error: err })))
			)
		)
	);

export const search$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.search.started.type),
		debounceTime(100),
		map((action: Action<string>) => actions.search.done({
			params: action.payload,
			result: search(action.payload, store.getState().search.indices)
		}))
	);

export const updateAutocomplete$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		map(() => store.getState().search.results),
		distinctUntilChanged(),
		map(allResults => ({ allResults, autocomplete: document.querySelectorAll('.search__autocomplete') })),
		filter(({ autocomplete}) => !!autocomplete.length),
		map(({ allResults, autocomplete }) => ({ flatResults: flattenSearchResults(allResults), autocomplete })),
		tap(({ flatResults, autocomplete }) => {
			autocomplete.forEach(autocompleteEl => {
				const instance = M.Autocomplete.getInstance(autocompleteEl);
				if (!instance) {
					RE_INIT_AUTOCOMPLETE$.next();
					return;
				}

				instance.updateData(flatResults);
				instance.open();
			});
		}),
		noEmit()
	)

export const searchEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	refreshIndices$,
	indexNotepads$,
	search$,
	updateAutocomplete$
);
