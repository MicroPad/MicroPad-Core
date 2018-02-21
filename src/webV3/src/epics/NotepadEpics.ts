import { actions } from '../actions';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import * as Parser from 'upad-parse/dist/index.js';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';

const parseNpx$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.parseNpx.started)),
		map((action: Action<string>) => {
			try {
				Parser.parse(action.payload, ['asciimath']);
			} catch (err) {
				alert(`Error reading file`);
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

export const notepadEpics$ = combineEpics(
	parseNpx$
);
