import { combineEpics } from 'redux-observable';
import { concatMap, filter, map } from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { actions } from '../../core/actions';
import { from, Observable } from 'rxjs';
import { IStoreState } from '../../core/types';
import { Store } from 'redux';
import { EpicDeps } from './index';
import { isAction } from '../util';

export namespace HelpEpics {
	export const getHelp$ = (action$: Observable<Action<void>>, store: Store<IStoreState>, { Dialog }) =>
		action$.pipe(
			isAction(actions.getHelp.started),
			concatMap(() =>
				from((async () => {
					const notepadList = store.getState().notepads.savedNotepadTitles;
					if (!notepadList || !notepadList.includes('Help')) return true;

					return await Dialog.confirm(`You have already imported the Help notebook. It can be accessed from the notebooks dropdown. If you continue you will lose any changes made to the notebook.`);
				})())
			),
			filter(Boolean),
			map(() => actions.getHelp.done({ params: undefined, result: undefined }))
		);

	export const getHelpSuccess$ = (action$: Observable<Action<Success<void, void>>>, store: Store<IStoreState>, { helpNpx }) =>
		action$.pipe(
			isAction(actions.getHelp.done),
			map(() => actions.parseNpx.started(helpNpx))
		);

	export const helpEpics$ = combineEpics<Action<any>, any, EpicDeps>(
		getHelp$,
		getHelpSuccess$
	);
}
