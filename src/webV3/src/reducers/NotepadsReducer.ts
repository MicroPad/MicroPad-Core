import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INotepadStoreState } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType } from 'redux-typescript-actions';

export class NotepadsReducer implements IReducer<INotepadStoreState> {
	public readonly key: string = 'notepads';
	public readonly initialState: INotepadStoreState = {
		isLoading: false
	};

	public reducer(state: INotepadStoreState, action: Action): INotepadStoreState {
		if (isType(action, actions.parseNpx.done)) {
			const result = action.payload.result;

			return {
				...state,
				savedNotepadTitles: [
					...(state.savedNotepadTitles || []),
					result.title
				],
				notepad: result
			};
		} else if (isType(action, actions.getNotepadList.started)) {
			return {
				...state,
				isLoading: true
			};
		} else if (isType(action, actions.getNotepadList.failed)) {
			return {
				...state,
				isLoading: false
			};
		} else if (isType(action, actions.getNotepadList.done)) {
			return {
				...state,
				isLoading: false,
				savedNotepadTitles: action.payload.result
			};
		}

		return Object.freeze(state);
	}
}
