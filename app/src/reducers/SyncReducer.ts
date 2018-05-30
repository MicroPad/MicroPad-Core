import { SyncedNotepadList, SyncUser } from '../types/SyncTypes';
import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';

export interface ISyncState {
	user?: SyncUser;
	notepadList?: SyncedNotepadList;
}

export class SyncReducer implements IReducer<ISyncState> {
	public readonly key: string = 'sync';
	public readonly initialState: ISyncState = {};

	public reducer(state: ISyncState, action: Action): ISyncState {
		return state;
	}
}
