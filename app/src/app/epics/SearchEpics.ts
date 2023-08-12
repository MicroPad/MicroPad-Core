import { combineEpics, ofType } from 'redux-observable';
import { catchError, debounceTime, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { EpicDeps, EpicStore } from './index';
import { indexNotepads, search } from '../services/SearchService';
import { IStoreState } from '../types';
import { SearchResult } from '../reducers/SearchReducer';

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
		map(action => action.payload.trim()),
		withLatestFrom(state$),
		map(([query, state]) => actions.search.done({
			params: query,
			result: search(query, state.search.indices)
		}))
	);

export const hashtagSearchOrJump$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.hashtagSearchOrJump.type),
		map(action => (action as MicroPadActions['hashtagSearchOrJump']).payload.trim()),
		withLatestFrom(state$),
		mergeMap(([query, state]: [string, IStoreState]): MicroPadAction[] => {
			const rawResults = search(query.trim(), state.search.indices);
			const results: Array<SearchResult & { notepadTitle: string }> = Object.entries(rawResults)
				.map(([notepadTitle, results]) => results.map(res => ({ ...res, notepadTitle })))
				.flat()
				.filter(res => res.noteRef !== state.currentNote.ref);

			// if this hashtag is in 1 other note, just jump to that
			if (results.length === 1) {
				const result = results[0];
				const jumpAction: MicroPadAction = result.notepadTitle === state.notepads.notepad?.item?.title
					? actions.loadNote.started(result.noteRef)
					: actions.restoreJsonNotepadAndLoadNote({ noteRef: result.noteRef, notepadTitle: result.notepadTitle });
				return [jumpAction];
			}

			return [
				actions.search.done({ params: query, result: rawResults }),
				actions.openModal('search-modal')
			];
		})
	);

export const searchEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	refreshIndices$,
	indexNotepads$,
	search$,
	hashtagSearchOrJump$,
);
