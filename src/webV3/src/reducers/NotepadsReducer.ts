import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INote, INotepad, INotepadsStoreState, ISection } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType } from 'redux-typescript-actions';
import { getNotepadObjectByRef, restoreObject } from '../util';
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
		} else if (isType(action, actions.renameNotepad.done)) {
			const notepad = <INotepad> restoreObject(<INotepad> {
				...state.notepad!.item!,
				title: action.payload.params
			}, Parser.createNotepad(action.payload.params));
			notepad.sections = notepad.sections.map((section: ISection) => {
				section.parent = notepad;
				return section;
			});

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				},
				savedNotepadTitles: [
					...(state.savedNotepadTitles || []).filter(title => title !== action.payload.result),
					action.payload.params
				]
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			let newNotepad = { ...state.notepad!.item! };
			newNotepad = getNotepadObjectByRef(newNotepad, action.payload, (obj) => {
				if (!!(<ISection> obj).notes) {
					// Delete a section
					obj.parent.sections.splice(obj.parent.sections.indexOf(<ISection> obj), 1);
				} else {
					// Delete a note
					let section = <ISection> obj.parent;
					section.notes.splice(section.notes.indexOf(<INote> obj), 1);
				}

				return <INote> {};
			});

			const notepad = <INotepad> restoreObject(newNotepad, Parser.createNotepad(newNotepad.title));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.renameNotepadObject)) {
			let newNotepad = { ...state.notepad!.item! };
			newNotepad = getNotepadObjectByRef(newNotepad, action.payload.internalRef, (obj) => {
				if (!!(<ISection> obj).notes) {
					// Rename a section
					const index = obj.parent.sections.indexOf(<ISection> obj);
					obj.parent.sections[index] = restoreObject<ISection>({
						...obj.parent.sections[index],
						title: action.payload.newName
					}, Parser.createSection(''));

					return obj.parent.sections[index];
				} else {
					// Rename a note
					const section = <ISection> obj.parent;
					const index = section.notes.indexOf(<INote> obj);

					section.notes[index] = restoreObject<INote>({
						...section.notes[index],
						title: action.payload.newName
					}, Parser.createNote(''));

					return section.notes[index];
				}
			});

			const notepad = <INotepad> restoreObject(newNotepad, Parser.createNotepad(newNotepad.title));

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
