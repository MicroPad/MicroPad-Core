import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { APP_NAME, IStoreState, MICROPAD_URL } from '../types';
import * as localforage from 'localforage';
import { Action, Success } from 'redux-typescript-actions';
import { INotepad } from '../types/NotepadTypes';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { IVersion } from '../types/MetaTypes';
import * as Materialize from 'materialize-css/dist/js/materialize';

export namespace MetaEpics {
	export const closeDrawingEditorOnZoom$ = (action$, store) =>
		action$.pipe(
			isAction(actions.updateZoomLevel),
			map(() => store.getState()),
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
			map((action: Action<Success<string, INotepad>>) => action.payload.result.title),
			filter((title: string) => title === 'Help'),
			map(() => actions.setHelpPref(true))
		);

	export const checkVersion$ = (action$, store) =>
		action$.pipe(
			isAction(actions.checkVersion),
			map(() => store.getState()),
			map((state: IStoreState) => state.meta.version),
			map((version: IVersion) => `${version.major}.${version.minor}.${version.patch}`),
			switchMap((version: string) =>
				ajax({
					url: `${MICROPAD_URL}/version.txt?rnd=${Math.random()}`,
					crossDomain: true,
					headers: {
						'Content-Type': 'text/plain; charset=UTF-8'
					},
					responseType: 'text'
				}).pipe(
					map((res: AjaxResponse) => res.response.trim()),
					filter(latestVersion => latestVersion !== version),
					tap((latestVersion: string) =>
						Materialize.toast(`v${latestVersion} of ${APP_NAME} is out now <a target="_blank" class="btn-flat amber-text" style="font-weight: 500;" href="${MICROPAD_URL}/#download">UPDATE</a>`)
					)
				)
			),
			filter(() => false)
		);

	export const metaEpics$ = combineEpics(
		closeDrawingEditorOnZoom$,
		saveHelpPreference$,
		revertHelpPrefOnHelpLoad$,
		checkVersion$
	);
}
