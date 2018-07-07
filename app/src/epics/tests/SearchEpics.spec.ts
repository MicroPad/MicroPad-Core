import { SearchEpics } from '../SearchEpics';
import { ActionsObservable } from 'redux-observable';
import { actions } from '../../actions';
import { cold } from 'jest-marbles';
import configureStore from 'redux-mock-store';
import { IStoreState } from '../../types';
import { ineeda } from 'ineeda';
import { Action } from 'redux-typescript-actions';
import { ElementArgs } from 'upad-parse/dist/Note';
import { FlatNotepad, Note } from 'upad-parse/dist';

describe('search$', () => {
	let toFind: Note;
	let store;

	beforeEach(() => {
		toFind = new Note('Found it!');
		toFind = toFind.addElement({
			type: 'markdown',
			args: ineeda<ElementArgs>(),
			content: '#test'
		});
		toFind.parent = 'abc';

		let mockNotepad: FlatNotepad = new FlatNotepad('Test Notepad');
		mockNotepad = mockNotepad.addSection({ title: 'Test', internalRef: 'abc' });
		mockNotepad = mockNotepad.addNote(toFind);

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
		res.subscribe((action: Action<Note[]>) => expect(action.payload[0].title).toEqual(toFind.title));
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
