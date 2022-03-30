import { combineEpics, ofType } from 'redux-observable';
import { noEmit } from '../util';
import { catchError, delay, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { APP_NAME, IStoreState, MICROPAD_URL } from '../types';
import * as localforage from 'localforage';
import { Action } from 'typescript-fsa';
import { ajax } from 'rxjs/ajax';
import { EMPTY, Observable, timer } from 'rxjs';
import { lt as versionLessThan } from 'semver';
import { EpicDeps, EpicStore } from './index';
import { IVersion } from '../reducers/AppReducer';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { AppInfoMessage } from '../reducers/AppInfoReducer';

export const closeDrawingEditorOnZoom$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.updateZoomLevel.type),
		withLatestFrom(state$),
		map(([,state]) => state.currentNote.elementEditing),
		filter((elementId: string) => elementId.includes('drawing')),
		map(() => actions.openEditor(''))
	);

export const saveHelpPreference$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.setHelpPref.type),
		switchMap(action => localforage.setItem('show help', (action as Action<boolean>).payload)),
		noEmit()
	);

export const revertHelpPrefOnHelpLoad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.parseNpx.done.type),
		map(action => (action as MicroPadActions['parseNpx']['done']).payload.result.title),
		filter((title: string) => title === 'Help'),
		map(() => actions.setHelpPref(true))
	);

export const checkVersion$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.checkVersion.type),
		withLatestFrom(state$),
		map(([,state]) => state.app.version),
		map((version: IVersion) => `${version.major}.${version.minor}.${version.patch}`),
		switchMap((version: string) =>
			ajax<string>({
				url: `${MICROPAD_URL}/version.txt?rnd=${Math.random()}`,
				headers: {
					'Content-Type': 'text/plain; charset=UTF-8'
				},
				responseType: 'text',
				timeout: 10000 // 10 seconds
			}).pipe(
				map(res => res.response.trim()),
				filter(latestVersion => versionLessThan(version, latestVersion)),
				map((latestVersion: string) => actions.setInfoMessage({
					text: `v${latestVersion} of ${APP_NAME} is out now! Update for all the latest goodies.`,
					cta: `${MICROPAD_URL}/#download`
				})),
				catchError(err => {
					console.error(err);
					return EMPTY;
				})
			)
		)
	);

export const getInfoMessages$ = () =>
	timer(5 * 1000, 5 * 60 * 1000).pipe(
		switchMap(() =>
			ajax<AppInfoMessage>({
				url: `${MICROPAD_URL}/info.json?rnd=${Math.random()}`,
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				},
				responseType: 'json',
				timeout: 10000 // 10 seconds
			}).pipe(
				map(res => actions.setInfoMessage(res.response)),
				catchError(() => { return EMPTY; })
			)
		)
	);

export const persistTheme$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.selectTheme.type),
		switchMap(action => localforage.setItem('theme', (action as MicroPadActions['selectTheme']).payload)),
		noEmit()
	);

export const openModal$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.openModal.type),
		delay(0), // put us on the next frame of the event loop so the modal can get into the DOM
		tap(action => openModal((action as MicroPadActions['openModal']).payload)),
		noEmit()
	);

export const closeModal$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.closeModal.type),
		withLatestFrom(state$),
		tap(([,state]) => {
			const modalId = state.app.currentModalId;
			if (!modalId) return;
			const el = document.getElementById(modalId);
			if (!el) return;

			M.Modal.getInstance(el).close();
		}),
		noEmit()
	);

export const appEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	closeDrawingEditorOnZoom$,
	saveHelpPreference$,
	revertHelpPrefOnHelpLoad$,
	checkVersion$,
	getInfoMessages$,
	persistTheme$,
	openModal$,
	closeModal$
);

function openModal(id: string) {
	const modalEl = document.getElementById(id);
	if (!modalEl) {
		throw new Error(`${id} is not a modal because it doesn't exist in th DOM.`);
	}

	open();
	function open() {
		setTimeout(() => {
			try {
				M.Modal.getInstance(document.getElementById(id)!).open();
			} catch (e) {
				open();
			}
		}, 0);
	}
}
