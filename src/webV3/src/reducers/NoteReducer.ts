import { IReducer } from '../types/ReducerType';
import { INote, INoteStoreState } from '../types/NotepadTypes';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export class NoteReducer implements IReducer<INoteStoreState> {
	public readonly key: string = 'currentNote';
	public readonly initialState: INoteStoreState = {
		isLoading: false
	};

	public reducer(state: INoteStoreState, action: Action): INoteStoreState {
		if (isType(action, actions.parseNpx.started) || isType(action, actions.newNotepad) || isType(action, actions.openNotepadFromStorage.started)) {
			return this.initialState;
		} else if (isType(action, actions.loadNote)) {
			const note: INote = action.payload;

			return {
				...state,
				isLoading: false,
				item: note
			};
		}

		return state;
	}
}
