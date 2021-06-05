import { combineEpics, ofType } from 'redux-observable';
import { concatMap, map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { Dispatch } from 'redux';
import { EpicDeps, EpicStore } from './index';
import { filterTruthy } from '../util';
import { actions, MicroPadAction } from '../actions';
import { Dialog } from '../services/dialogs';

export const getHelp$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.getHelp.started.type),
		concatMap(() =>
			from((async () => {
				const notepadList = store.getState().notepads.savedNotepadTitles;
				if (!notepadList || !notepadList.includes('Help')) return true;

				return Dialog.confirm(`You have already imported the Help notebook. It can be accessed from the notebooks dropdown. If you continue you will lose any changes made to the notebook.`);
			})())
		),
		filterTruthy(),
		map(() => actions.getHelp.done({ params: undefined, result: undefined }))
	);

export const getHelpSuccess$ = (action$: Observable<MicroPadAction>, store: EpicStore, { helpNpx }) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.getHelp.done.type),
		map(() => actions.parseNpx.started(helpNpx))
	);

export const helpEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	getHelp$,
	getHelpSuccess$
);
