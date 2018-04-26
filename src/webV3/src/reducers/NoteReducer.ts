import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface IInsertElementState {
	x: number;
	y: number;
	enabled: boolean;
}

export interface ICurrentNoteState {
	ref: string;
	assetUrls: object;
	elementEditing: string;
	insertElement: IInsertElementState;
}

export class NoteReducer implements IReducer<ICurrentNoteState> {
	public readonly key: string = 'currentNote';
	public readonly initialState: ICurrentNoteState = {
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
			|| isType(action, actions.newNotepad)
			|| isType(action, actions.openNotepadFromStorage.started)
			|| isType(action, actions.deleteNotepad)
			|| isType(action, actions.renameNotepad.done)
		) {
			this.cleanUpObjectUrls(state.assetUrls);
			return this.initialState;
		} else if (isType(action, actions.loadNote.done)) {
			this.cleanUpObjectUrls(state.assetUrls);
			return {
				...state,
				ref: action.payload.params,
				assetUrls: action.payload.result,
				elementEditing: ''
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			if (action.payload === state.ref) {
				this.cleanUpObjectUrls(state.assetUrls);
				return this.initialState;
			}
		} else if (isType(action, actions.openEditor)) {
			return {
				...state,
				elementEditing: action.payload
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
		}

		return state;
	}

	private cleanUpObjectUrls(assetUrls: object) {
		for (let ref in assetUrls) {
			if (!assetUrls.hasOwnProperty(ref)) continue;

			URL.revokeObjectURL(assetUrls[ref]);
		}
	}
}
