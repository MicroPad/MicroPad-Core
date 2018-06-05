import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INote, INotepad, INotepadsStoreState, INotepadStoreState, IParent, ISection } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType } from 'redux-typescript-actions';
import { getNotepadObjectByRef, restoreObject } from '../util';
import * as Parser from 'upad-parse/dist/index.js';
import { format } from 'date-fns';
import * as stringify from 'json-stringify-safe';

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
				notepad: {
					saving: false,
					isLoading: true
				}
			};
		} else if (isType(action, actions.parseNpx.failed)) {
			return {
				...state,
				notepad: {
					isLoading: false,
					saving: false
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
			if (state.savedNotepadTitles
				&& state.savedNotepadTitles.some(title => title.toLowerCase() === notepad.title.toLowerCase()))
				notepad.title += ' (DUPLICATE)';

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
				title: action.payload.params,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
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
			let newNotepad = { ...state.notepad!.item!, lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ') };
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
			let newNotepad = { ...state.notepad!.item!, lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ') };
			newNotepad = getNotepadObjectByRef(newNotepad, action.payload.internalRef, (obj) => {
				if (!!(<ISection> obj).notes) {
					// Rename a section
					let section = <ISection> obj;
					const index = section.parent.sections.indexOf(<ISection> obj);
					section = restoreObject<ISection>({
						...section,
						title: action.payload.newName
					}, Parser.createSection(''));

					const deepRename = (parentSection) => {
						parentSection.notes.forEach((note: INote) => note.parent = parentSection);
						parentSection.sections.forEach((subSection: ISection) => {
							subSection.parent = parentSection;
							deepRename(subSection);
						});
					};
					deepRename(section);

					obj.parent.sections[index] = section;

					return section;
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
		} else if (isType(action, actions.checkNoteAssets.done)) {
			const newNotepad = restoreObject<INotepad>({ ...action.payload.result }, Parser.createNotepad(''));
			if (stringify(state.notepad!.item) !== stringify(action.payload.result)) newNotepad.lastModified = format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ');

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: newNotepad
				}
			};
		} else if (isType(action, actions.updateElement)) {
			const newNotepad = getNotepadObjectByRef({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
			}, action.payload.noteRef, (obj) => {
				const section = <ISection> obj.parent;
				const index = section.notes.indexOf(<INote> obj);

				const newElements = section.notes[index].elements.map(element =>
					(element.args.id === action.payload.elementId) ? action.payload.element : element
				);
				// const newElements = section.notes[index].elements.filter(element => element.args.id !== action.payload.elementId);
				// newElements.unshift(action.payload.element);

				section.notes[index] = restoreObject<INote>({
					...section.notes[index],
					elements: newElements

				}, Parser.createNote(''));

				return section.notes[index];
			});

			const notepad = <INotepad> restoreObject({ ...newNotepad }, Parser.createNotepad(newNotepad.title));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.newSection)) {
			const newObj = action.payload;

			const newSection = Parser.createSection(newObj.title);
			newSection.parent = newObj.parent;

			const newParent: IParent = {
				...newObj.parent,
				sections: [
					...newObj.parent.sections,
					newSection
				]
			};

			if (!newParent.internalRef) {
				// Adding to the root notepad
				return {
					...state,
					notepad: {
						...state.notepad!,
						item: restoreObject<INotepad>(<INotepad> newParent, Parser.createNotepad(''))
					}
				};
			} else {
				const newNotepad = getNotepadObjectByRef({ ...state.notepad!.item! }, newParent.internalRef, obj => {
					(<ISection> obj).addSection(newSection);
					return obj;
				});

				return {
					...state,
					notepad: {
						...state.notepad!,
						item: restoreObject<INotepad>({ ...newNotepad, lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')}, Parser.createNotepad(''))
					}
				};
			}
		} else if (isType(action, actions.newNote)) {
			const newObj = action.payload;

			const newNote = Parser.createNote(newObj.title, []);
			const newNotepad = getNotepadObjectByRef({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
			}, newObj.parent.internalRef!, obj => {
				(<ISection> obj).addNote(newNote);
				return obj;
			});

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: restoreObject<INotepad>(newNotepad, Parser.createNotepad(''))
				}
			};
		} else if (isType(action, actions.trackAsset)) {
			const guid = action.payload;

			const newNotepad = restoreObject<INotepad>({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ'),
				notepadAssets: Array.from(new Set([
					...state.notepad!.item!.notepadAssets,
					guid
				]))
			}, Parser.createNotepad(''));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: newNotepad,
				}
			};
		} else if (isType(action, actions.untrackAsset)) {
			const newNotepad = restoreObject<INotepad>({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ'),
				notepadAssets: state.notepad!.item!.notepadAssets.filter(guid => guid !== action.payload)
			}, Parser.createNotepad(''));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: newNotepad,
				}
			};
		} else if (isType(action, actions.insertElement)) {
			const newNotepad = getNotepadObjectByRef({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
			}, action.payload.noteRef, (obj) => {
				const section = <ISection> obj.parent;
				const index = section.notes.indexOf(<INote> obj);

				const newElements = [
					...section.notes[index].elements,
					action.payload.element
				];

				section.notes[index] = restoreObject<INote>({
					...section.notes[index],
					elements: newElements

				}, Parser.createNote(''));

				return section.notes[index];
			});

			const notepad = <INotepad> restoreObject({ ...newNotepad }, Parser.createNotepad(newNotepad.title));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.deleteElement)) {
			let assetGuid: string | undefined;

			const newNotepad = getNotepadObjectByRef({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
			}, action.payload.noteRef, (obj) => {
				const section = <ISection> obj.parent;
				const index = section.notes.indexOf(<INote> obj);

				const newElements = section.notes[index].elements.filter(e => {
					if (e.args.id !== action.payload.elementId) return true;

					assetGuid = e.args.ext;
					return false;
				});

				section.notes[index] = restoreObject<INote>({
					...section.notes[index],
					elements: newElements

				}, Parser.createNote(''));

				return section.notes[index];
			});

			const notepad = <INotepad> restoreObject({ ...newNotepad }, Parser.createNotepad(newNotepad.title));
			if (!!assetGuid) notepad.notepadAssets = notepad.notepadAssets.filter(guid => guid !== assetGuid);

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.updateBibliography)) {
			const newNotepad = getNotepadObjectByRef({
				...state.notepad!.item!,
				lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
			}, action.payload.noteRef, (obj) => {
				const section = <ISection> obj.parent;
				const index = section.notes.indexOf(<INote> obj);

				section.notes[index] = restoreObject<INote>({
					...section.notes[index],
					bibliography: action.payload.sources

				}, Parser.createNote(''));

				return section.notes[index];
			});

			const notepad = <INotepad> restoreObject({ ...newNotepad }, Parser.createNotepad(newNotepad.title));

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.updateCurrentSyncId)) {
			if (!(state.notepad || <INotepadStoreState> {}).item) return state;
			const title = state.notepad!.item!.title;

			const id = action.payload[title];
			if (!id) return state;

			return {
				...state,
				notepad: {
					...state.notepad!,
					activeSyncId: id
				}
			};
		} else if (isType(action, actions.addToSync.done)) {
			if (!state.notepad) return state;
			return {
				...state,
				notepad: {
					...state.notepad,
					activeSyncId: action.payload.result
				}
			};
		} else if (isType(action, actions.deleteFromSync.done)) {
			if (!state.notepad) return state;
			return {
				...state,
				notepad: {
					...state.notepad,
					activeSyncId: undefined
				}
			};
		}

		return Object.freeze(state);
	}
}
