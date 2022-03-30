import { combineEpics, ofType } from 'redux-observable';
import { catchError, debounceTime, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { EpicDeps, EpicStore } from './index';
import { indexNotepads, search } from '../services/SearchService';
import { IStoreState } from '../types';

export const refreshIndices$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.saveNotepad.done.type, actions.deleteNotepad.type),
		map(() => actions.indexNotepads.started())
	);

export const indexNotepads$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.indexNotepads.started.type),
		withLatestFrom(state$),
		switchMap(([,state]) =>
			from(indexNotepads(state.search.indices, state.notepadPasskeys)).pipe(
				map(newIndices => actions.indexNotepads.done({ params: undefined, result: newIndices })),
				catchError(err => {
					console.error(err);
					return of(actions.indexNotepads.failed({ params: undefined, error: err }));
				})
			)
		)
	);

export const search$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.search.started.type),
		debounceTime(100),
		map(action => (action as MicroPadActions['search']['started'])),
		withLatestFrom(state$),
		map(([action, state]) => actions.search.done({
			params: action.payload,
			result: search(action.payload, state.search.indices)
		}))
	);

export const searchEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	refreshIndices$,
	indexNotepads$,
	search$
);
