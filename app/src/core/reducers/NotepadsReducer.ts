import { MicroPadReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType } from 'redux-typescript-actions';
import * as stringify from 'json-stringify-safe';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { format } from 'date-fns';

export class NotepadsReducer extends MicroPadReducer<INotepadsStoreState> {
	public readonly key = 'notepads';
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
			let notepad = action.payload;

			if (state.savedNotepadTitles
				&& state.savedNotepadTitles.some(title => title.toLowerCase() === notepad.title.toLowerCase())
			) notepad = notepad.clone({}, notepad.title + ' (DUPLICATE)');

			return {
				...state,
				savedNotepadTitles: Array.from(new Set([
					...(state.savedNotepadTitles || []),
					notepad.title
				])).sort(),
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
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({ lastModified: new Date() }, action.payload.params)
				},
				savedNotepadTitles: Array.from(new Set([
					...(state.savedNotepadTitles || []).filter(title => title !== action.payload.result),
					action.payload.params
				])).sort()
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			const isSubSectionOf = (section: FlatSection, parent: string): boolean => state.notepad!.item!
				.pathFrom(section)
				.slice(1)
				.map((p: FlatSection) => p.internalRef)
				.includes(parent);

			let notepad = state.notepad!.item!.clone({
				lastModified: new Date(),

				// Remove the section + any children it might have
				sections: Object.values(state.notepad!.item!.sections)
					.filter(s => s.internalRef !== action.payload && !isSubSectionOf(s, action.payload))
					.reduce((sections, cur) => {
						sections[cur.internalRef] = cur;
						return sections;
					}, {})
			});

			// Remove the note if it's the one we want out/if it's the child of a section that doesn't exist anymore
			notepad = notepad.clone({
				notes: Object.values(state.notepad!.item!.notes)
					.filter(n => n.internalRef !== action.payload && !!notepad.sections[n.parent as string])
					.reduce((notes, cur) => {
						notes[cur.internalRef] = cur;
						return notes;
					}, {})
			});

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad

				}
			};
		} else if (isType(action, actions.renameNotepadObject)) {
			let notepad: FlatNotepad = state.notepad!.item!;
			if (!!notepad.notes[action.payload.internalRef]) {
				// Rename note
				notepad = notepad.clone({
					lastModified: new Date(),
					notes: {
						...notepad.notes,
						[action.payload.internalRef]: notepad.notes[action.payload.internalRef].clone({ title: action.payload.newName })
					}
				});
			} else if (!!notepad.sections[action.payload.internalRef]) {
				// Rename Section
				notepad = notepad.clone({
					lastModified: new Date(),
					sections: {
						...notepad.sections,
						[action.payload.internalRef]: { ...notepad.sections[action.payload.internalRef], title: action.payload.newName }
					}
				});
			}

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.checkNoteAssets.done)) {
			let newNotepad: FlatNotepad = action.payload.result;
			if (stringify(state.notepad!.item) !== stringify(action.payload.result)) newNotepad = newNotepad.modified();

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: newNotepad
				}
			};
		} else if (isType(action, actions.updateElement)) {
			let notepad: FlatNotepad = state.notepad!.item!;
			notepad = notepad.clone({
				lastModified: new Date(),
				notes: {
					...notepad.notes,
					[action.payload.noteRef]: notepad.notes[action.payload.noteRef].clone({
						elements: notepad.notes[action.payload.noteRef].elements.map(e =>
							(e.args.id === action.payload.elementId) ? action.payload.element : e
						)
					})
				}
			});

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: notepad
				}
			};
		} else if (isType(action, actions.newSection)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!
						.addSection(FlatNotepad.makeFlatSection(action.payload.title, action.payload.parent))
						.modified()
				}
			};
		} else if (isType(action, actions.newNote)) {
			const note = new Note(action.payload.title);
			note.parent = action.payload.parent;

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.addNote(note).modified()
				}
			};
		} else if (isType(action, actions.trackAsset)) {
			const guid = action.payload;

			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.addAsset(guid).modified()
				}
			};
		} else if (isType(action, actions.untrackAsset)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({
						lastModified: new Date(),
						notepadAssets: state.notepad!.item!.notepadAssets.filter(uuid => uuid !== action.payload)
					})
				}
			};
		} else if (isType(action, actions.insertElement)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({
						lastModified: new Date(),
						notes: {
							...state.notepad!.item!.notes,
							[action.payload.noteRef]: state.notepad!.item!.notes[action.payload.noteRef].addElement(action.payload.element)
						}
					})
				}
			};
		} else if (isType(action, actions.deleteElement)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({
						lastModified: new Date(),
						notes: {
							...state.notepad!.item!.notes,
							[action.payload.noteRef]: state.notepad!.item!.notes[action.payload.noteRef].clone({
								elements: state.notepad!.item!.notes[action.payload.noteRef].elements
									.filter(e => e.args.id !== action.payload.elementId)
							})
						}
					})
				}
			};
		} else if (isType(action, actions.updateBibliography)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({
						lastModified: new Date(),
						notes: {
							...state.notepad!.item!.notes,
							[action.payload.noteRef]: state.notepad!.item!.notes[action.payload.noteRef].clone({
								bibliography: action.payload.sources
							})
						}
					})
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
		} else if (isType(action, actions.moveNotepadObject)) {
			if (!state.notepad || !state.notepad.item) return state;

			const { objectRef, newParent } = action.payload;
			const type: 'sections' | 'notes' = action.payload.type + 's' as 'sections' | 'notes';
			const notepad = state.notepad.item;

			return {
				...state,
				notepad: {
					...state.notepad,
					item: notepad.clone({
						lastModified: new Date(),
						[type]: Object.values(notepad[type])
							.map((item: FlatSection | Note) => {
								if (item.internalRef !== objectRef) return item;

								// Handle sections being moved to the root (directly under the notepad)
								if (newParent === 'notepad') return { ...item, parentRef: undefined };

								// Change the parent on the item if it's the one we're moving
								return !!(item as Note).clone ? (item as Note).clone({ parent: newParent }) : { ...item, parentRef: newParent };
							})
							// Convert back to the object from an array of FlatSections/Notes
							.reduce((items: { [uuid: string]: FlatSection | Note }, item: FlatSection | Note) => {
								items[item.internalRef] = item;
								return items;
							}, {})
					})
				}
			};
		} else if (isType(action, actions.quickNote.done)) {
			if (!state.notepad || !state.notepad.item) return state;
			let notepad = state.notepad.item;

			// Ensure we have a section for the quick note to go in
			const parent: FlatSection | undefined = Object.values(notepad.sections)
				.find(section => section.title === 'Unorganised Notes' && !section.parentRef);

			let newParent: FlatSection | undefined;
			if (!parent) newParent = FlatNotepad.makeFlatSection('Unorganised Notes');

			if (!parent && !!newParent) notepad = notepad.addSection(newParent);

			// Make the quick note
			const ref = action.payload.result;
			const note = new Note(format(new Date(), 'dddd, D MMMM YYYY h:mm:ss A')).clone({
				internalRef: ref,
				parent: (parent || newParent!).internalRef
			});

			return {
				...state,
				notepad: {
					...state.notepad,
					item: notepad.addNote(note).modified()
				}
			};
		} else if (isType(action, actions.encryptNotepad.done)) {
			if (!state.notepad || !state.notepad.item) return state;
			let notepad = state.notepad.item;

			return {
				...state,
				notepad: {
					...state.notepad,
					item: notepad.clone({ crypto: 'AES-256' }).modified()
				}
			};
		}

		return Object.freeze(state);
	}
}
