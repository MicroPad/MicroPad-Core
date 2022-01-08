import { combineEpics, ofType } from 'redux-observable';
import { forkJoin, from, Observable, of } from 'rxjs';
import { Action, Success } from 'typescript-fsa';
import { actions, MicroPadAction } from '../actions';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EpicDeps, EpicStore } from './index';
import { Notepad, Translators } from 'upad-parse/dist';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { getDueDates, sortDueDates } from '../services/DueDates';
import { Dispatch } from 'redux';

export const getDueDatesOnInit$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<void, string[]>>>(actions.getNotepadList.done.type),
		map((action: Action<Success<void, string[]>>) => actions.getDueDates.started(action.payload.result))
	);

export const getDueDatesOnSave$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<Notepad, void>>>(actions.saveNotepad.done.type),
		map(() => store.getState().notepads.savedNotepadTitles!),
		map(titles => actions.getDueDates.started(titles))
	);

export const getDueDates$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string[]>>(actions.getDueDates.started.type),
		map((action: Action<string[]>) =>
			action.payload.map(name =>
				getStorage().notepadStorage.getItem<string>(name)
					.then(json => JSON.parse(json!) as NotepadShell)
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

export const dueDatesEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	getDueDatesOnInit$,
	getDueDatesOnSave$,
	getDueDates$
);
