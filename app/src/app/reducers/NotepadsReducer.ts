import { MicroPadReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { actions } from '../actions';
import { isType, Success } from 'redux-typescript-actions';
import stringify from 'json-stringify-safe';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { format } from 'date-fns';
import { DueItem } from '../services/DueDates';
import { isReadOnlyNotebook } from '../ReadOnly';

export class NotepadsReducer extends MicroPadReducer<INotepadsStoreState> {
	public readonly key = 'notepads';
	public readonly initialState: INotepadsStoreState = {
		isLoading: false,
		dueDates: { isLoading: false, dueItems: [] }
	};

	public reducer(state: INotepadsStoreState, action: Action): INotepadsStoreState {
		let newState = this.reducerImpl(state, action);

		const isReadOnly = isReadOnlyNotebook(newState.notepad?.item?.title ?? '');
		if (newState.notepad && newState.notepad?.isReadOnly !== isReadOnly) {
			newState = {
				...newState,
				notepad: {
					...newState.notepad,
					isReadOnly: isReadOnlyNotebook(newState.notepad?.item?.title ?? '')
				}
			};
		}

		return newState;
	}

	private reducerImpl(state: INotepadsStoreState, action: Action): INotepadsStoreState {
		if (isType(action, actions.parseNpx.done)) {
			const result = action.payload.result;

			return {
				...state,
				savedNotepadTitles: NotepadsReducer.getNotebookListWithMemo(Array.from(new Set([
					...(state.savedNotepadTitles || []),
					result.title
				])), state.savedNotepadTitles),
				notepad: {
					isLoading: false,
					saving: false,
					isReadOnly: isReadOnlyNotebook(result.title),
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
				savedNotepadTitles: NotepadsReducer.getNotebookListWithMemo(Array.from(new Set([
					...(state.savedNotepadTitles || []),
					...action.payload.result
				])), state.savedNotepadTitles)
			};
		} else if (isType(action, actions.newNotepad)) {
			let notepad = action.payload;

			if (state.savedNotepadTitles?.some(title => title.toLowerCase() === notepad.title.toLowerCase())) {
				notepad = notepad.clone({}, notepad.title + ' (DUPLICATE)');
			}

			return {
				...state,
				savedNotepadTitles: NotepadsReducer.getNotebookListWithMemo(Array.from(new Set([
					...(state.savedNotepadTitles || []),
					notepad.title
				])).sort(), state.savedNotepadTitles),
				notepad: {
					isLoading: false,
					saving: false,
					isReadOnly: isReadOnlyNotebook(notepad.title),
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
				savedNotepadTitles: NotepadsReducer.getNotebookListWithMemo(
					state.savedNotepadTitles?.filter(title => title !== action.payload) ?? [],
					state.savedNotepadTitles
				),
				dueDates: {
					...state.dueDates,
					dueItems: state.dueDates.dueItems.filter(item => item.notepadTitle !== action.payload)
				}
			};
		} else if (isType(action, actions.renameNotepad.done)) {
			return {
				...state,
				notepad: {
					...state.notepad!,
					item: state.notepad!.item!.clone({ lastModified: new Date() }, action.payload.params)
				},
				savedNotepadTitles: NotepadsReducer.getNotebookListWithMemo(Array.from(new Set([
					...(state.savedNotepadTitles || []).filter(title => title !== action.payload.result),
					action.payload.params
				])).sort(), state.savedNotepadTitles)
			};
		} else if (isType(action, actions.deleteNotepadObject)) {
			const isSubSectionOf = (section: FlatSection, parent: string): boolean => state.notepad!.item!
				.pathFrom(section)
				.slice(1)
				.map(p => (p as FlatSection).internalRef)
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
			if (!(state.notepad || {} as INotepadStoreState).item) return state;
			const title = state.notepad!.item!.title;

			const id = action.payload[title];
			if (!id) return state;

			return {
				...state,
				notepad: {
					...state.notepad!,
					activeSyncId: id.notepad
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
			const note = new Note(format(new Date(), 'EEEE, d LLLL yyyy pp')).clone({
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
		} else if (isType(action, actions.encryptNotepad)) {
			if (!state.notepad || !state.notepad.item) return state;
			let notepad = state.notepad.item;

			return {
				...state,
				notepad: {
					...state.notepad,
					item: notepad.clone({
						crypto: 'AES-256-GZ',
						lastModified: new Date()
					})
				}
			};
		} else if (isType(action, actions.closeNotepad)) {
			return {
				...state,
				notepad: !!state.notepad ? { ...state.notepad, item: undefined } : undefined
			};
		} else if (isType(action, actions.syncUpload.failed)) {
			if (!state.notepad || !state.notepad.item || !action.payload.error.response || !action.payload.error.response.error) return state;

			if (!action.payload.error.response.error.includes('they are the scribe')) return state;

			return {
				...state,
				notepad: {
					...state.notepad,
					item: state.notepad.item.clone({ lastModified: new Date(0) })
				}
			};
		} else if (isType(action, actions.getDueDates.started)) {
			return {
				...state,
				dueDates: {
					...state.dueDates,
					isLoading: true
				}
			}
		} else if (isType(action, actions.getDueDates.done) || isType(action, actions.getDueDates.failed)) {
			let dueItems: DueItem[] = state.dueDates.dueItems;

			if (!action.error) {
				const payload = action.payload as unknown as Success<void, DueItem[]>;
				dueItems = payload.result;
			}

			return {
				...state,
				dueDates: {
					isLoading: false,
					dueItems
				}
			}
		}

		return state;
	}

	private static getNotebookListWithMemo(newList: string[], currentList: string[] | undefined): string[] | undefined {
		return JSON.stringify(newList) === JSON.stringify(currentList) ? currentList : newList;
	}
}
