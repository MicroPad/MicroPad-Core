import { combineEpics, ofType } from 'redux-observable';
import { concatMap, map, withLatestFrom } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { EpicDeps, EpicStore } from './index';
import { filterTruthy } from '../util';
import { actions, MicroPadAction } from '../actions';
import { Dialog } from '../services/dialogs';
import { IStoreState } from '../types';

const HELP_READONLY_DATE = new Date('2021-08-18T14:34:30.958+12:00');

export const getHelp$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.getHelp.started.type),
		withLatestFrom(state$),
		concatMap(([,state]) =>
			from((async () => {
				const notepadList = state.notepads.savedNotepadTitles;
				if (!notepadList || !notepadList.includes('Help')) return true;

				const helpLastModified: string | null = await getStorage().notepadStorage.getItem<string>('Help')
					.then(np => np ? JSON.parse(np).lastModified : null)
					.catch(err => { console.error(err); return null; });

				if (!helpLastModified || new Date(helpLastModified).getTime() < HELP_READONLY_DATE.getTime()) {
					return Dialog.confirm(`You have already imported the Help notebook. It can be accessed from the notebooks dropdown. If you continue you will lose any changes made to the notebook.`);
				}

				return true;
			})())
		),
		filterTruthy(),
		map(() => actions.getHelp.done({}))
	);

export const getHelpSuccess$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { helpNpx }) =>
	action$.pipe(
		ofType(actions.getHelp.done.type),
		map(() => actions.parseNpx.started(helpNpx))
	);

export const helpEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	getHelp$,
	getHelpSuccess$
);
