import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INotepadStoreState } from '../types/NotepadTypes';

export class NotepadsReducer implements IReducer<INotepadStoreState> {
	public readonly key: string = 'notepads';
	public readonly initialState: INotepadStoreState;

	public reducer(state: INotepadStoreState, action: Action): INotepadStoreState {
		let newState = {
			...state
		};

		return Object.freeze(newState);
	}
}
