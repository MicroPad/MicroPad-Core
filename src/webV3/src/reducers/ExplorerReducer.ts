import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INote, ISection } from '../types/NotepadTypes';

export interface IExplorerState {
	openSections: string[];
}

export class ExplorerReducer implements IReducer<IExplorerState> {
	public readonly key: string = 'explorer';
	public readonly initialState: IExplorerState = {
		openSections: []
	};

	public reducer(state: IExplorerState, action: Action): IExplorerState {
		if (isType(action, actions.parseNpx.done) || isType(action, actions.parseNpx.failed) || isType(action, actions.deleteNotepad)) {
			return this.initialState;
		} else if (isType(action, actions.expandSection)) {
			const guid: string = action.payload;

			return {
				openSections: [
					...state.openSections,
					guid
				]
			};
		} else if (isType(action, actions.collapseSelection)) {
			const guidToClose: string = action.payload;

			return {
				openSections: state.openSections.filter((guid: string) => guid !== guidToClose)
			};
		} else if (isType(action, actions.loadNote)) {
			const note: INote = action.payload;
			const noteFamily: Set<string> = new Set<string>(state.openSections);

			// Add the note and its parents to the list
			let parent: ISection = <ISection> note.parent;
			while (!!parent.parent) {
				noteFamily.add(parent.internalRef);
				parent = <ISection> parent.parent;
			}

			return {
				openSections: Array.from(noteFamily)
			};
		}

		return state;
	}
}
