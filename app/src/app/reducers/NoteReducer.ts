import { AbstractReducer } from './AbstractReducer';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface IInsertElementState {
	x: number;
	y: number;
	enabled: boolean;
}

export interface ICurrentNoteState {
	isLoading: boolean;
	ref: string;
	assetUrls: object;
	elementEditing: string;
	insertElement: IInsertElementState;
}

export class NoteReducer extends AbstractReducer<ICurrentNoteState> {
	public readonly key = 'currentNote';
	public readonly initialState: ICurrentNoteState = {
		isLoading: false,
		ref: '',
		assetUrls: {},
		elementEditing: '',
		insertElement: {
			x: 0,
			y: 0,
			enabled: false
		}
	};

	public reducer(state: ICurrentNoteState, action: Action): ICurrentNoteState {
		if (
			isType(action, actions.parseNpx.started)
			|| isType(action, actions.syncDownload.started)
			|| isType(action, actions.newNotepad)
			|| isType(action, actions.openNotepadFromStorage.started)
			|| isType(action, actions.deleteNotepad)
			|| isType(action, actions.renameNotepad.done)
		) {
			NoteReducer.cleanUpObjectUrls(state.assetUrls);
			return this.initialState;
		} else if (isType(action, actions.loadNote.started)) {
			return {
				...state,
				isLoading: true
			};
		} else if (isType(action, actions.loadNote.failed)) {
			return {
				...state,
				isLoading: false
			};
		} else if (isType(action, actions.loadNote.done)) {
			NoteReducer.cleanUpObjectUrls(state.assetUrls);
			return {
				...state,
				isLoading: false,
				ref: action.payload.params,
				assetUrls: action.payload.result,
				elementEditing: ''
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			if (action.payload === state.ref) {
				NoteReducer.cleanUpObjectUrls(state.assetUrls);
				return this.initialState;
			}
		} else if (isType(action, actions.openEditor)) {
			return {
				...state,
				elementEditing: action.payload,
				insertElement: {
					...state.insertElement,
					enabled: false
				}
			};
		} else if (isType(action, actions.toggleInsertMenu)) {
			return {
				...state,
				insertElement: {
					...state.insertElement,
					enabled: !state.insertElement.enabled,
					...action.payload
				}
			};
		} else if (isType(action, actions.closeNote) || isType(action, actions.closeNotepad)) {
			return this.initialState;
		} else if (isType(action, actions.flipFullScreenState)) {
			return {
				...state,
				insertElement: { ...state.insertElement, enabled: false }
			}
		}

		return state;
	}

	private static cleanUpObjectUrls(assetUrls: object) {
		for (const url of Object.values(assetUrls)) {
			URL.revokeObjectURL(assetUrls[url]);
		}
	}
}
