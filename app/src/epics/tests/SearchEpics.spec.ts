import { SearchEpics } from '../SearchEpics';
import { ActionsObservable } from 'redux-observable';
import { actions } from '../../actions';
import { cold } from 'jest-marbles';
import * as configureStore from 'redux-mock-store';
import { IStoreState } from '../../types';
import { ineeda } from 'ineeda';
import * as Parser from 'upad-parse';
import { IElementArgs, INote, INotepad } from '../../types/NotepadTypes';
import { Action } from 'redux-typescript-actions';

describe('search$', () => {
	let toFind: INote;
	let store;

	beforeEach(() => {
		toFind = Parser.createNote('Found it!', []);
		toFind.addElement('markdown', ineeda<IElementArgs>(), '#test');

		const mockNotepad: INotepad = Parser.createNotepad('Test Notepad');
		mockNotepad.addSection(Parser.createSection('Test'));
		mockNotepad.sections[0].addNote(toFind);

		store = configureStore()({
			notepads: {
				notepad: {
					item: mockNotepad
				}
			}
		} as IStoreState);
	});

	it(`should search the notepad with the hashtag`, () => {
		// Arrange

		// Act
		const res = SearchEpics.search$(ActionsObservable.of(actions.search('#test')), store);

		// Assert
		res.subscribe((action: Action<INote[]>) => expect(action.payload[0].title).toEqual(toFind.title));
	});

	[
		'not a hashtag',
		'#',
		'',
		'#notme'
	].forEach(query => {
		it(`should dispatch an empty DISPLAY_HASH_TAG_SEARCH_RESULTS with the query '${query}'`, () => {
			// Arrange

			// Act
			const res = SearchEpics.search$(ActionsObservable.of(actions.search(query)), store);

			// Assert
			expect(res).toBeObservable(cold('(a|)', {
				a: actions.displayHashTagSearchResults([])
			}));
		});
	});
});
