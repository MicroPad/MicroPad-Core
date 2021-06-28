import { combineEpics, ofType } from 'redux-observable';
import { actions, MicroPadAction } from '../actions';
import { Dispatch } from 'redux';
import { EpicDeps, EpicStore } from './index';
import { Observable } from 'rxjs';
import { Action } from 'redux-typescript-actions';
import { map } from 'rxjs/operators';
import { ThemeValues } from '../ThemeValues';
import { ThemeName } from '../types/Themes';

export const feelingLucky$ = (actions$: Observable<MicroPadAction>, store: EpicStore) =>
	actions$.pipe(
		ofType<MicroPadAction, Action<void>>(actions.feelingLucky.type),
		map(() => store.getState()),
		map(state => {
			// Select a random theme
			const themeNames = Object.keys(ThemeValues);
			let theme: ThemeName;
			do {
				theme = themeNames[themeNames.length * Math.random() | 0] as ThemeName
			} while (!theme || theme === state.app.theme);

			return actions.selectTheme(theme);
		})
	);

export const feelingLuckyEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	feelingLucky$
);
