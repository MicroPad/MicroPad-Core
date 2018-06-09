import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { filter, map, switchMap } from 'rxjs/operators';
import { IStoreState } from '../types';
import * as localforage from 'localforage';
import { Action, Success } from 'redux-typescript-actions';
import { INotepad } from '../types/NotepadTypes';

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

	export const metaEpics$ = combineEpics(
		closeDrawingEditorOnZoom$,
		saveHelpPreference$,
		revertHelpPrefOnHelpLoad$
	);
}
