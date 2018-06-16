import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export namespace HelpEpics {
	export const getHelp$ = (action$, store, { helpNpx }) =>
		action$.pipe(
			filter((action: Action<void>) => isType(action, actions.getHelp)),
			map(() => actions.parseNpx.started(helpNpx))
		);

	export const helpEpics$ = combineEpics(
		getHelp$
	);
}
