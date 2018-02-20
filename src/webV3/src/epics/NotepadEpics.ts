import { actions } from '../actions';
import { catchError, filter, map } from 'rxjs/operators';
import { Action, Failure, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/parse.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		map((action: Action<string>) => {
			Parser.parse(action.payload, ['asciimath']);
			return actions.parseNpx.done({
				params: '',
				result: Parser.notepad
			});
		}),
		catchError(err => Observable.of(actions.parseNpx.failed({
			params: '',
			error: err
		})))
	);

const parseNpxFail$ = action$ =>
	action$.pipe(
		filter((action: Action<Failure<string, any>>) => isType(action, actions.parseNpx.failed)),
		map(() => {
			alert(`Error reading file`);
			return Observable.empty();
		})
	);

export const notepadEpics$ = combineEpics(
	parseNpx$,
	parseNpxFail$
);
