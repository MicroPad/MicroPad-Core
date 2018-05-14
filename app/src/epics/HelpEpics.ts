import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

const getHelp$ = action$ =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.getHelp)),
		map(() => actions.parseNpx.started(helpNpx))
	);

export const helpEpics$ = combineEpics(
	getHelp$
);
