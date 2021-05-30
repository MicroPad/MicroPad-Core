import { combineEpics, ofType } from 'redux-observable';
import { noEmit } from '../util';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { APP_NAME, IStoreState, MICROPAD_URL } from '../types';
import * as localforage from 'localforage';
import { Action, Success } from 'redux-typescript-actions';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { FlatNotepad } from 'upad-parse/dist';
import { EMPTY, Observable } from 'rxjs';
import { lt as versionLessThan } from 'semver';
import { ThemeName } from '../types/Themes';
import { EpicDeps, EpicStore } from './index';
import { IVersion } from '../reducers/AppReducer';
import { actions, MicroPadAction } from '../actions';
import { Dispatch } from 'redux';
import { Dialog } from '../services/dialogs';

export const closeDrawingEditorOnZoom$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.updateZoomLevel.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.currentNote.elementEditing),
		filter((elementId: string) => elementId.includes('drawing')),
		map(() => actions.openEditor(''))
	);

export const saveHelpPreference$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<boolean>>(actions.setHelpPref.type),
		switchMap((action: Action<boolean>) => localforage.setItem('show help', action.payload)),
		noEmit()
	);

export const revertHelpPrefOnHelpLoad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<string, FlatNotepad>>>(actions.parseNpx.done.type),
		map((action: Action<Success<string, FlatNotepad>>) => action.payload.result.title),
		filter((title: string) => title === 'Help'),
		map(() => actions.setHelpPref(true))
	);

export const checkVersion$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.checkVersion.type),
		map(() => store.getState()),
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
					Dialog.confirmUnsafe(`v${latestVersion} of ${APP_NAME} is out now! <a target="_blank" href="${MICROPAD_URL}/#download">Update here</a>.`)
				),
				catchError(err => {
					console.error(err);
					return EMPTY;
				})
			)
		),
		noEmit()
	);

export const persistTheme$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<ThemeName>>(actions.selectTheme.type),
		switchMap((action: Action<ThemeName>) => localforage.setItem('theme', action.payload)),
		noEmit()
	);

export const appEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	closeDrawingEditorOnZoom$,
	saveHelpPreference$,
	revertHelpPrefOnHelpLoad$,
	checkVersion$,
	persistTheme$
);
