import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export class NoteReducer implements IReducer<string> {
	public readonly key: string = 'currentNote';
	public readonly initialState: string = ''; // Internal reference of the current note

	public reducer(state: string, action: Action): string {
		if (isType(action, actions.parseNpx.started)
			|| isType(action, actions.newNotepad)
			|| isType(action, actions.openNotepadFromStorage.started)
			|| isType(action, actions.deleteNotepad
			|| isType(action, actions.renameNotepad.done))) {
				return this.initialState;
		} else if (isType(action, actions.loadNote)) {
			return action.payload;
		}

		return state;
	}
}
