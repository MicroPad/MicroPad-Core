import { combineEpics } from 'redux-observable';
import { concatMap, map, switchMap, take } from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { actions } from '../../core/actions';
import { from, Observable } from 'rxjs';
import { IStoreState } from '../../core/types';
import { Store } from 'redux';
import { EpicDeps } from './index';
import { filterTruthy, isAction } from '../util';

export namespace HelpEpics {
	export const getHelp$ = (action$: Observable<Action<void>>, state$: Observable<IStoreState>, { Dialog }: EpicDeps) =>
		action$.pipe(
			isAction(actions.getHelp.started),
			switchMap(() => state$.pipe(take(1))),
			concatMap(state =>
				from((async () => {
					const notepadList = state.notepads.savedNotepadTitles;
					if (!notepadList || !notepadList.includes('Help')) return true;

					// @ts-ignore, typescript is incorrect about this
					return Dialog.confirm(`You have already imported the Help notebook. It can be accessed from the notebooks dropdown. If you continue you will lose any changes made to the notebook.`);
				})())
			),
			filterTruthy(),
			map(() => actions.getHelp.done({ params: undefined, result: undefined }))
		);

	export const getHelpSuccess$ = (action$: Observable<Action<Success<void, void>>>, _, { helpNpx }) =>
		action$.pipe(
			isAction(actions.getHelp.done),
			map(() => actions.parseNpx.started(helpNpx))
		);

	export const helpEpics$ = combineEpics(
		getHelp$,
		getHelpSuccess$
	);
}
