import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../../core/actions';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { isAction } from '../util';
import { NewNotepadObjectAction } from '../../core/types/ActionTypes';
import { IStoreState } from '../../core/types';
import { FlatNotepad } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';

export namespace ExplorerEpics {
	export const expandAll$ = (action$, store) =>
		action$.pipe(
			filter((action: Action<void>) => isType(action, actions.expandAllExplorer.started)),
			map(() => (store.getState().notepads.notepad || <INotepadStoreState> {}).item),
			filter(Boolean),
			map((notepad: FlatNotepad) => [
				...Object.keys(notepad.sections),
				...Object.keys(notepad.notes)
			]),
			map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
		);

	export const autoLoadNewSection$ = (action$, store) =>
		action$.pipe(
			isAction(actions.newSection),
			map((action: Action<NewNotepadObjectAction>) => [action.payload, (<IStoreState> store.getState()).notepads.notepad!.item]),
			filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!notepad),
			map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => {
				const parentRef = insertAction.parent || undefined;

				return Object.values((notepad as FlatNotepad).sections).find(s => s.title === insertAction.title && s.parentRef === parentRef);
			}),
			filter(Boolean),
			map((newSection: FlatSection) => actions.expandSection(newSection.internalRef))
		);

	export const explorerEpics$ = combineEpics(
		expandAll$,
		autoLoadNewSection$
	);
}
