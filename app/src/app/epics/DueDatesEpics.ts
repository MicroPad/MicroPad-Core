import { combineEpics, ofType } from 'redux-observable';
import { forkJoin, from, Observable, of } from 'rxjs';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { catchError, distinctUntilChanged, filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { EpicDeps, EpicStore } from './index';
import { Translators } from 'upad-parse/dist';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { getDueDates, sortDueDates } from '../services/DueDates';
import { IStoreState } from '../types';
import { SettingsStorageKeys } from '../storage/settings-storage-keys';
import { filterTruthy, noEmit } from '../util';

export const getDueDatesOnInit$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.getNotepadList.done.type),
		map(action => actions.getDueDates.started((action as MicroPadActions['getNotepadList']['done']).payload.result))
	);

export const getDueDatesOnSave$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.saveNotepad.done.type),
		withLatestFrom(state$),
		map(([,state]) => actions.getDueDates.started(state.notepads.savedNotepadTitles!))
	);

export const getDueDates$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.getDueDates.started.type),
		map(action =>
			(action as MicroPadActions['getDueDates']['started']).payload.map(name =>
				getStorage().notepadStorage.getItem<string>(name)
					.then(json => JSON.parse(json!) as NotepadShell)
			)
		),
		switchMap(notebookObjs$ =>
			from(Promise.all(notebookObjs$)).pipe(
				withLatestFrom(state$),
				switchMap(([notebookObjs, state]) => {
					const dueDates$ = notebookObjs
						.filter(obj => !obj.crypto || !!state.notepadPasskeys[obj.title])
						.map(obj =>
							from(Translators.Json.toFlatNotepadFromNotepad(obj, state.notepadPasskeys[obj.title])).pipe(
								map(notepad => getDueDates(notepad, state.dueDateSettings))
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

export const reindexDueDatesOnSettingsChange$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.setShowHistoricalDueDates.type),
		switchMap(() => state$.pipe(
			take(1),
			map(state => state.notepads.savedNotepadTitles),
			filterTruthy(),
			map(notepads => actions.getDueDates.started(notepads)))
		));

export const persistDueDateOpts$ = (_action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	state$.pipe(
		map(state => state.dueDateSettings),
		filter(opts => opts.showHistoricalDueDates !== null),
		distinctUntilChanged(),
		switchMap(dueDateSettings => from(
			getStorage()
				.settingsStorage
				.setItem(SettingsStorageKeys.DUE_DATE_OPTS, dueDateSettings)
				.catch(e => { console.error(e); })
		)),
		noEmit()
	);

export const dueDatesEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	getDueDatesOnInit$,
	getDueDatesOnSave$,
	getDueDates$,
	reindexDueDatesOnSettingsChange$,
	persistDueDateOpts$,
);
