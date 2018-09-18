// import { SearchEpics } from '../SearchEpics';
// import { ActionsObservable } from 'redux-observable';
// import { actions } from '../../actions';
// import { ineeda } from 'ineeda';
// import { Action } from 'redux-typescript-actions';
// import { ElementArgs } from 'upad-parse/dist/Note';
// import { FlatNotepad, Note } from 'upad-parse/dist';
// import { HashTagSearchResults } from '../../reducers/SearchReducer';
//
// describe('search$', () => {
// 	let toFind: Note;
// 	let mockStorage: () => { [name: string]: LocalForage };
//
// 	beforeEach(() => {
// 		toFind = new Note('Found it!');
// 		toFind = toFind.addElement({
// 			type: 'markdown',
// 			args: ineeda<ElementArgs>(),
// 			content: '#test'
// 		});
// 		toFind.parent = 'abc';
//
// 		let mockNotepad: FlatNotepad = new FlatNotepad('Test Notepad');
// 		mockNotepad = mockNotepad.addSection({ title: 'Test', internalRef: 'abc' });
// 		mockNotepad = mockNotepad.addNote(toFind);
//
// 		mockStorage = () => {
// 			return {
// 				notepadStorage: ineeda<LocalForage>({
// 					iterate: async (callback: (res: string) => void): Promise<void> => {
// 						callback(mockNotepad.toNotepad().toJson());
// 						return;
// 					}
// 				})
// 			};
// 		};
// 	});
//
// 	it(`should search the notepad with the hashtag`, () => {
// 		// Arrange
//
// 		// Act
// 		const res = SearchEpics.search$(ActionsObservable.of(actions.search('#test')), null, {
// 			getStorage: mockStorage
// 		});
//
// 		// Assert
// 		res.subscribe((action: Action<HashTagSearchResults>) =>
// 			expect(action.payload['Test Notepad'][0].title).toEqual(toFind.title)
// 		);
// 	});
//
// 	[
// 		'not a hashtag',
// 		'#',
// 		'',
// 		'#notme'
// 	].forEach(query => {
// 		it(`should dispatch an empty DISPLAY_HASH_TAG_SEARCH_RESULTS with the query '${query}'`, () => {
// 			// Arrange
//
// 			// Act
// 			const res = SearchEpics.search$(ActionsObservable.of(actions.search(query)), null, {
// 				getStorage: mockStorage
// 			});
//
// 			// Assert
// 			res.subscribe(result => expect(result).toEqual(actions.displayHashTagSearchResults({})));
// 		});
// 	});
// });
