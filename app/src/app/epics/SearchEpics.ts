import { combineEpics, ofType } from 'redux-observable';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action, Success } from 'redux-typescript-actions';
import { actions, MicroPadAction } from '../actions';
import { Dispatch } from 'redux';
import { SearchIndices } from '../types/ActionTypes';
import { EpicDeps, EpicStore } from './index';
import { Notepad } from 'upad-parse/dist';
import { indexNotepads, search } from '../services/SearchService';

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

export const searchEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	refreshIndices$,
	indexNotepads$,
	search$
);
