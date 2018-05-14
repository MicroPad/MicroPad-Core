import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepad, INotepadStoreState, IParent, ISection } from '../types/NotepadTypes';
import { getNotepadObjectByRef, isAction } from '../util';
import { INewNotepadObjectAction } from '../types/ActionTypes';
import { IStoreState } from '../types';

export namespace ExplorerEpics {
	export const expandAll$ = (action$, store) =>
		action$.pipe(
			filter((action: Action<void>) => isType(action, actions.expandAllExplorer.started)),
			map(() => (store.getState().notepads.notepad || <INotepadStoreState> {}).item),
			filter(Boolean),
			map((notepad: INotepad) => {
				const response: string[] = [];

				const mapSection = (section: ISection) => {
					response.push(section.internalRef);
					section.notes.forEach(note => response.push(note.internalRef));
					section.sections.forEach(subSection => mapSection(subSection));
				};
				notepad.sections.forEach(section => mapSection(section));

				return response;
			}),
			map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
		);

	export const autoLoadNewSection$ = (action$, store) =>
		action$.pipe(
			isAction(actions.newSection),
			map((action: Action<INewNotepadObjectAction>) => [action.payload, (<IStoreState> store.getState()).notepads.notepad!.item]),
			filter(([insertAction, notepad]: [INewNotepadObjectAction, INotepad]) => !!insertAction && !!notepad),
			map(([insertAction, notepad]: [INewNotepadObjectAction, INotepad]) => {
				if (!insertAction.parent.internalRef) return [insertAction, notepad];

				// Find the new section
				let parent: ISection | false = false;
				getNotepadObjectByRef(notepad, insertAction.parent.internalRef!, obj => parent = <ISection> obj);

				return [insertAction, parent];
			}),
			filter(([insertAction, parent]: [INewNotepadObjectAction, IParent]) => !!parent),
			map(([insertAction, parent]: [INewNotepadObjectAction, IParent]) => parent.sections.find(s => s.title === insertAction.title)),
			filter(Boolean),
			map((newSection: ISection) => actions.expandSection(newSection.internalRef))
		);

	export const explorerEpics$ = combineEpics(
		expandAll$,
		autoLoadNewSection$
	);
}
