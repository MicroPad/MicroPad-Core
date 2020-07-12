import { combineEpics, ofType } from 'redux-observable';
import { forkJoin, from, Observable, of } from 'rxjs';
import { Action, Success } from 'redux-typescript-actions';
import { IStoreState } from '../types';
import { MiddlewareAPI } from 'redux';
import { actions } from '../actions';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EpicDeps } from './index';
import { Notepad, Translators } from 'upad-parse/dist';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { getDueDates, sortDueDates } from '../services/DueDates';

export const getDueDatesOnInit$ = (action$: Observable<Action<Success<void, string[]>>>) =>
	action$.pipe(
		ofType<Action<Success<void, string[]>>>(actions.getNotepadList.done.type),
		map((action) => actions.getDueDates.started(action.payload.result))
	);

export const getDueDatesOnSave$ = (action$: Observable<Action<Success<Notepad, void>>>, store: MiddlewareAPI<IStoreState>) =>
	action$.pipe(
		ofType<Action<Success<Notepad, void>>>(actions.saveNotepad.done.type),
		map(() => store.getState().notepads.savedNotepadTitles!),
		map(titles => actions.getDueDates.started(titles))
	);

export const getDueDates$ = (action$: Observable<Action<string[]>>, store: MiddlewareAPI<IStoreState>, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<Action<string[]>>(actions.getDueDates.started.type),
		map(action =>
			action.payload.map(name =>
				getStorage().notepadStorage.getItem<string>(name)
					.then(json => JSON.parse(json) as NotepadShell)
			)
		),
		switchMap(notebookObjs$ =>
			from(Promise.all(notebookObjs$)).pipe(
				switchMap(notebookObjs => {
					const dueDates$ = notebookObjs
						.filter(obj => !obj.crypto || !!store.getState().notepadPasskeys[obj.title])
						.map(obj =>
							from(Translators.Json.toFlatNotepadFromNotepad(obj, store.getState().notepadPasskeys[obj.title])).pipe(
								map(notepad => getDueDates(notepad))
							)
						);

					return forkJoin(dueDates$).pipe(
						map(dueDates =>
							dueDates
								.filter(dates => dates.length > 0)
								.reduce((acc, cur) => [...acc, ...cur], [])
						),
						map(dueDates => sortDueDates(dueDates))
					)
				}),
				map(dueDates => actions.getDueDates.done({ params: [], result: dueDates })),
				catchError((error: Error) => of(actions.getDueDates.failed({ params: [], error })))
			)
		)
	);

export const dueDatesEpics$ = combineEpics<Action<any>, IStoreState, EpicDeps>(
	getDueDatesOnInit$,
	getDueDatesOnSave$,
	getDueDates$
);
