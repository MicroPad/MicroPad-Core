import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../../core/actions';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { APP_NAME, IStoreState, MICROPAD_URL } from '../../core/types';
import * as localforage from 'localforage';
import { Action, Success } from 'redux-typescript-actions';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { FlatNotepad } from 'upad-parse/dist';
import { EMPTY, Observable } from 'rxjs';
import { lt as versionLessThan } from 'semver';
import { ThemeName } from '../../core/types/Themes';
import { IVersion } from '../../core/reducers/AppReducer';
import { EpicDeps } from './index';

export namespace AppEpics {
	export const closeDrawingEditorOnZoom$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.updateZoomLevel),
			switchMap(() => state$.pipe(take(1))),
			map((state: IStoreState) => state.currentNote.elementEditing),
			filter((elementId: string) => elementId.includes('drawing')),
			map(() => actions.openEditor(''))
		);

	export const saveHelpPreference$ = action$ =>
		action$.pipe(
			isAction(actions.setHelpPref),
			switchMap((action: Action<boolean>) => localforage.setItem('show help', action.payload)),
			filter(() => false)
		);

	export const revertHelpPrefOnHelpLoad$ = action$ =>
		action$.pipe(
			isAction(actions.parseNpx.done),
			map((action: Action<Success<string, FlatNotepad>>) => action.payload.result.title),
			filter((title: string) => title === 'Help'),
			map(() => actions.setHelpPref(true))
		);

	export const checkVersion$ = (action$, state$: Observable<IStoreState>, { Dialog }: EpicDeps) =>
		action$.pipe(
			isAction(actions.checkVersion),
			switchMap(() => state$.pipe(take(1))),
			map((state: IStoreState) => state.app.version),
			map((version: IVersion) => `${version.major}.${version.minor}.${version.patch}`),
			switchMap((version: string) =>
				ajax({
					url: `${MICROPAD_URL}/version.txt?rnd=${Math.random()}`,
					crossDomain: true,
					headers: {
						'Content-Type': 'text/plain; charset=UTF-8'
					},
					responseType: 'text',
					timeout: 10000 // 10 seconds
				}).pipe(
					map((res: AjaxResponse) => res.response.trim()),
					filter(latestVersion => versionLessThan(version, latestVersion)),
					tap((latestVersion: string) =>
						// @ts-ignore
						Dialog.confirmUnsafe(`v${latestVersion} of ${APP_NAME} is out now! <a target="_blank" href="${MICROPAD_URL}/#download">Update here</a>.`)
					),
					catchError(err => {
						console.error(err);
						return EMPTY;
					})
				)
			),
			filter(() => false)
		);

	export const persistTheme$ = action$ =>
		action$.pipe(
			isAction(actions.selectTheme),
			switchMap((action: Action<ThemeName>) => localforage.setItem('theme', action.payload)),
			filter(() => false)
		);

	export const appEpics$ = combineEpics(
		closeDrawingEditorOnZoom$,
		saveHelpPreference$,
		revertHelpPrefOnHelpLoad$,
		checkVersion$,
		persistTheme$
	);
}
