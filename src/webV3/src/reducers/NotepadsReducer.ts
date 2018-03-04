import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INotepad, INotepadsStoreState } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType } from 'redux-typescript-actions';
import { restoreObject } from '../util';
import * as Parser from 'upad-parse/dist/index.js';

export class NotepadsReducer implements IReducer<INotepadsStoreState> {
	public readonly key: string = 'notepads';
	public readonly initialState: INotepadsStoreState = {
		isLoading: false
	};

	public reducer(state: INotepadsStoreState, action: Action): INotepadsStoreState {
		if (isType(action, actions.parseNpx.done)) {
			const result = action.payload.result;

			return {
				...state,
				savedNotepadTitles: Array.from(new Set([
					...(state.savedNotepadTitles || []),
					result.title
				])),
				notepad: {
					isLoading: false,
					saving: false,
					item: result
				}
			};
		} else if (isType(action, actions.parseNpx.started)) {
			return {
				...state,
				isLoading: true,
				notepad: {
					saving: false,
					isLoading: true
				}
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
				savedNotepadTitles: Array.from(new Set([
					...(state.savedNotepadTitles || []),
					...action.payload.result
				]))
			};
		} else if (isType(action, actions.newNotepad)) {
			const notepad: INotepad = action.payload;
			notepad.notepadAssets = [];

			return {
				...state,
				savedNotepadTitles: Array.from(new Set([
					...(state.savedNotepadTitles || []),
					notepad.title
				])),
				notepad: {
					isLoading: false,
					saving: false,
					item: notepad
				}
			};
		} else if (isType(action, actions.saveNotepad.started)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					saving: true
				}
			};
		} else if (isType(action, actions.saveNotepad.done)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					saving: false
				}
			};
		} else if (isType(action, actions.saveNotepad.failed)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					saving: false
				}
			};
		} else if (isType(action, actions.deleteNotepad)) {
			return {
				...state,
				notepad: undefined,
				savedNotepadTitles: (state.savedNotepadTitles || []).filter(title => title !== action.payload)
			};
		} else if (isType(action, actions.renameNotepad)) {
			const notepad = <INotepad> restoreObject({
				...state.notepad!.item!,
				title: action.payload
			}, Parser.createNotepad(action.payload));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		}

		return Object.freeze(state);
	}
}
