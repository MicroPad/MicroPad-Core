import { IReducer } from '../types/ReducerType';
import { INote, INoteStoreState, ISection } from '../types/NotepadTypes';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { restoreObject } from '../util';
import * as Parser from 'upad-parse/dist/index.js';

export class NoteReducer implements IReducer<INoteStoreState> {
	public readonly key: string = 'currentNote';
	public readonly initialState: INoteStoreState = {
		isLoading: false
	};

	public reducer(state: INoteStoreState, action: Action): INoteStoreState {
		if (isType(action, actions.parseNpx.started)
			|| isType(action, actions.newNotepad)
			|| isType(action, actions.openNotepadFromStorage.started)
			|| isType(action, actions.deleteNotepad
				|| isType(action, actions.renameNotepad.done))) {
			return this.initialState;
		} else if (isType(action, actions.loadNote)) {
			const note: INote = restoreObject<INote>({ ...action.payload }, Parser.createNote(''));

			return {
				...state,
				isLoading: false,
				item: note
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			if (!state.item) return state;
			if (action.payload === state.item.internalRef) return this.initialState;

			const noteFamily: Set<string> = new Set<string>([state.item.internalRef]);

			// Add the note and its parents to the list
			let parent: ISection = <ISection> state.item.parent;
			while (!!parent.parent) {
				noteFamily.add(parent.internalRef);
				parent = <ISection> parent.parent;
			}

			if (noteFamily.has(action.payload)) return this.initialState;

			return state;
		} else if (isType(action, actions.updateNoteInNotepad)) {
			return {
				...state,
				item: action.payload
			};
		}

		return state;
	}
}
