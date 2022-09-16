import { combineEpics, ofType } from 'redux-observable';
import { actions, MicroPadAction } from '../actions';
import { EpicStore } from './index';
import { Observable, switchMap } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ThemeValues } from '../ThemeValues';
import { ThemeName } from '../types/Themes';

export const feelingLucky$ = (actions$: Observable<MicroPadAction>, state$: EpicStore) =>
	actions$.pipe(
		ofType(actions.feelingLucky.type),
		switchMap(() => state$.pipe(
			map(state => {
				// Select a random theme
				const themeNames = Object.keys(ThemeValues);
				let theme: ThemeName;
				do {
					theme = themeNames[themeNames.length * Math.random() | 0] as ThemeName
				} while (!theme || theme === state.app.theme);

				return actions.selectTheme(theme);
			}),
			take(1)
		))
	);

export const feelingLuckyEpics$ = combineEpics(
	feelingLucky$
);
