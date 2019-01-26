import { MicroPadReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { Note } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';

export interface IExplorerState {
	openSections: string[];
}

export class ExplorerReducer extends MicroPadReducer<IExplorerState> {
	public readonly key = 'explorer';
	public readonly initialState: IExplorerState = {
		openSections: []
	};

	public reducer(state: IExplorerState, action: Action): IExplorerState {
		if (isType(action, actions.parseNpx.done) || isType(action, actions.parseNpx.failed) || isType(action, actions.deleteNotepad)) {
			return this.initialState;
		} else if (isType(action, actions.expandSection)) {
			const guid: string = action.payload;

			return {
				...state,
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
		} else if (isType(action, actions.expandFromNote)) {
			const note: Note = action.payload.note;
			const notepad = action.payload.notepad;
			const noteFamily: Set<string> = new Set<string>([
				...state.openSections,
				...notepad.pathFrom(note).slice(1).map((parent: FlatSection) => parent.internalRef)
			]);

			return {
				...state,
				openSections: Array.from(noteFamily)
			};
		} else if (isType(action, actions.collapseAllExplorer)) {
			return {
				...state,
				openSections: []
			};
		} else if (isType(action, actions.expandAllExplorer.done)) {
			return {
				...state,
				openSections: [
					...state.openSections,
					...action.payload.result
				]
			};
		}

		return state;
	}
}
