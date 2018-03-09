import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface ICurrentNoteState {
	ref: string;
	assetUrls: object;
}

export class NoteReducer implements IReducer<ICurrentNoteState> {
	public readonly key: string = 'currentNote';
	public readonly initialState: ICurrentNoteState = {
		ref: '',
		assetUrls: []
	};

	public reducer(state: ICurrentNoteState, action: Action): ICurrentNoteState {
		if (
			isType(action, actions.parseNpx.started)
			|| isType(action, actions.newNotepad)
			|| isType(action, actions.openNotepadFromStorage.started)
			|| isType(action, actions.deleteNotepad)
			|| isType(action, actions.renameNotepad.done)
		) {
			return this.initialState;
		} else if (isType(action, actions.loadNote.done)) {
			return {
				...state,
				ref: action.payload.params,
				assetUrls: action.payload.result
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			if (action.payload === state.ref) return this.initialState;
		}

		return state;
	}
}
