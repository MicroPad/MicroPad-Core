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
				isLoading: false,
				savedNotepadTitles: [
					...(state.savedNotepadTitles || []),
					result.title
				],
				notepad: result
			};
		}

		return Object.freeze(state);
	}
}
