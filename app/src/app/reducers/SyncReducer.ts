import { INotepadSharingData, SyncUser } from '../types/SyncTypes';
import { AbstractReducer } from './AbstractReducer';
import { Action } from 'redux';
import { isType } from 'typescript-fsa';
import { actions } from '../actions';

export interface ISyncState {
	user?: SyncUser;
	sharedNotepadList?: Record<string, INotepadSharingData>;
	isLoading: boolean;
}

export class SyncReducer extends AbstractReducer<ISyncState> {
	public readonly key = 'sync';
	public readonly initialState: ISyncState = {
		isLoading: false
	};

	public reducer(state: ISyncState | undefined, action: Action): ISyncState {
		if (!state) state = this.initialState;
		if (
			isType(action, actions.syncLogin.started)
			|| isType(action, actions.syncDownload.started)
			|| isType(action, actions.syncUpload.started)
			|| isType(action, actions.deleteFromSync.started)
			|| isType(action, actions.addToSync.started)
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
			|| isType(action, actions.parseNpx.failed)
			|| isType(action, actions.addToSync.failed)
		) {
			return {
				...state,
				isLoading: false
			};
		} else if (
			isType(action, actions.syncDownload.done)
			|| isType(action, actions.syncUpload.done)
			|| isType(action, actions.addToSync.done)
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
				sharedNotepadList: undefined,
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
				sharedNotepadList: action.payload.result,
				isLoading: false
			};
		} else if (isType(action, actions.syncLogout)) {
			return { ...this.initialState };
		} else if (isType(action, actions.setSyncProStatus)) {
			if (!state.user) return state;
			return {
				...state,
				user: {
					...state.user,
					isPro: action.payload
				}
			}
		}

		return state;
	}
}
