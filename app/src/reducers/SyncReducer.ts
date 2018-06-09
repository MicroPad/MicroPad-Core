import { SyncedNotepadList, SyncUser } from '../types/SyncTypes';
import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface ISyncState {
	user?: SyncUser;
	notepadList?: SyncedNotepadList;
	isLoading: boolean;
}

export class SyncReducer implements IReducer<ISyncState> {
	public readonly key: string = 'sync';
	public readonly initialState: ISyncState = {
		isLoading: false
	};

	public reducer(state: ISyncState, action: Action): ISyncState {
		if (
			isType(action, actions.syncLogin.started)
			|| isType(action, actions.syncDownload.started)
			|| isType(action, actions.syncUpload.started)
			|| isType(action, actions.syncUploadAsset.started)
			|| isType(action, actions.deleteFromSync.started)
		) {
			return {
				...state,
				isLoading: true
			};
		} else if (
			isType(action, actions.syncLogin.failed)
			|| isType(action, actions.syncDownload.failed)
			|| isType(action, actions.syncUpload.failed)
			|| isType(action, actions.deleteFromSync.failed)
			|| isType(action, actions.syncProError)
		) {
			return {
				...state,
				isLoading: false
			};
		} else if (
			isType(action, actions.syncDownload.done)
			|| isType(action, actions.syncUpload.done)
			|| isType(action, actions.syncAssetsAllDone)
		) {
			return {
				...state,
				isLoading: false
			};
		} else if (isType(action, actions.syncLogin.done)) {
			return {
				...this.initialState,
				user: { ...action.payload.result }
			};
		} else if (isType(action, actions.getSyncedNotepadList.started)) {
			return {
				...state,
				notepadList: undefined,
				isLoading: true
			};
		} else if (isType(action, actions.getSyncedNotepadList.failed)) {
			return {
				...state,
				isLoading: false
			};
		} else if (isType(action, actions.getSyncedNotepadList.done)) {
			return {
				...state,
				notepadList: action.payload.result,
				isLoading: false
			};
		} else if (isType(action, actions.syncLogout)) {
			return { ...this.initialState };
		}

		return state;
	}
}
