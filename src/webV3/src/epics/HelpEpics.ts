import { combineEpics } from 'redux-observable';
import { catchError, filter, map, mergeMap, retry, takeUntil } from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { actions } from '../actions';
import { ajax } from 'rxjs/observable/dom/ajax';
import { MICROPAD_URL } from '../types';
import { AjaxResponse } from 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

const getHelp$ = action$ =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.getHelp.started)),
		mergeMap((action: Action<void>) =>
			ajax({
				url: `${MICROPAD_URL}/Help.npx`,
				crossDomain: true,
				headers: {
					'Content-Type': 'text/plain; charset=UTF-8'
				},
				responseType: 'text'
			})
				.pipe(
					map((helpNpx: AjaxResponse) => actions.getHelp.done({ params: 0, result: helpNpx.response })),
					retry(2),
					catchError(err => {
						alert(`I can't seem to find the help notepad. Are you online?`);
						return Observable.of(actions.getHelp.failed({ params: 0, error: err }));
					})
				)
		)
	);

const getHelpDone$ = action$ =>
	action$.pipe(
		filter((action: Action<Success<void, string>>) => isType(action, actions.getHelp.done)),
		map((action: Action<Success<void, string>>) => actions.parseNpx.started(action.payload.result))
	);

export const helpEpics$ = combineEpics(
	getHelp$,
	getHelpDone$
);
