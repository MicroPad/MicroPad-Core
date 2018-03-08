import { combineEpics } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepad, INotepadStoreState, ISection } from '../types/NotepadTypes';

const expandAll$ = (action$, store) =>
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

export const explorerEpics$ = combineEpics(
	expandAll$
);
