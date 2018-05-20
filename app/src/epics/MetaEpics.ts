import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { filter, map } from 'rxjs/operators';
import { IStoreState } from '../types';

export namespace MetaEpics {
	export const closeDrawingEditorOnZoom$ = (action$, store) =>
		action$.pipe(
			isAction(actions.updateZoomLevel),
			map(() => store.getState()),
			map((state: IStoreState) => state.currentNote.elementEditing),
			filter((elementId: string) => elementId.includes('drawing')),
			map(() => actions.openEditor(''))
		);

	export const metaEpics$ = combineEpics(
		closeDrawingEditorOnZoom$
	);
}
