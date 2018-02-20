import { actions, emptyAction } from '../actions';
import { filter, map } from 'rxjs/operators';
import { Action, Failure, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/parse.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		map((action: Action<string>) => {
			try {
				Parser.parse(action.payload, ['asciimath']);
			} catch (err) {
				return actions.parseNpx.failed({
					params: '',
					error: err
				});
			}

			return actions.parseNpx.done({
				params: '',
				result: Parser.notepad
			});
		})
	);

const parseNpxFail$ = action$ =>
	action$.pipe(
		filter((action: Action<Failure<string, any>>) => isType(action, actions.parseNpx.failed)),
		map(() => {
			alert(`Error reading file`);
			return emptyAction(0);
		})
	);

export const notepadEpics$ = combineEpics(
	parseNpx$,
	parseNpxFail$
);
