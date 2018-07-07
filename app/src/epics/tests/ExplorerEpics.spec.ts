import { ActionsObservable, createEpicMiddleware } from 'redux-observable';
import configureStore from 'redux-mock-store';
import { ExplorerEpics } from '../ExplorerEpics';
import { actions } from '../../actions';
import { cold } from 'jest-marbles';
import { IStoreState } from '../../types';
import { ineeda } from 'ineeda';
import { NewNotepadObjectAction } from '../../types/ActionTypes';
import { FlatNotepad } from 'upad-parse/dist';

const epic = createEpicMiddleware(ExplorerEpics.explorerEpics$);
const mockStore = configureStore([epic]);

let store;

afterEach(() => {
	epic.replaceEpic(ExplorerEpics.explorerEpics$);
});

describe('expandAll$', () => {
	it('should map to action with list of internalRefs', () => {
		// Arrange
		const testNotepad = new FlatNotepad('test')
			.addSection({ title: 'test1', internalRef: '1' })
			.addSection({ title: 'test2', internalRef: '2', parentRef: '1' })
			.addSection({ title: 'test3', internalRef: '3' });

		store = mockStore(ineeda<IStoreState>({
			notepads: {
				notepad: {
					item: testNotepad
				}
			}
		}));

		// Act
		const res = ExplorerEpics.expandAll$(ActionsObservable.of(actions.expandAllExplorer.started(undefined)), store);

		// Assert
		expect(res).toBeObservable(cold('(a|)', { a: actions.expandAllExplorer.done({
				params: undefined,
				result: ['1', '2', '3']
		})}));
	});

	it('should map to empty list if no sections in notepad', () => {
		// Arrange
		store = mockStore(ineeda<IStoreState>({
			notepads: {
				notepad: {
					item: new FlatNotepad('test')
				}
			}
		}));

		// Act
		const res = ExplorerEpics.expandAll$(ActionsObservable.of(actions.expandAllExplorer.started(undefined)), store);

		// Assert
		expect(res).toBeObservable(cold('(a|)', { a: actions.expandAllExplorer.done({
				params: undefined,
				result: []
		})}));
	});
});

describe('autoLoadNewSection$', () => {
	it('should map to action with list of internalRefs for a root level section', () => {
		// Arrange
		const testNotepad = new FlatNotepad('test')
			.addSection({ title: 'test', internalRef: 'expand me pls' });

		const params: NewNotepadObjectAction = {
			title: 'test'
		};

		store = mockStore({
			notepads: {
				notepad: {
					item: testNotepad
				}
			}
		} as IStoreState);

		// Act
		const res = ExplorerEpics.autoLoadNewSection$(ActionsObservable.of(actions.newSection(params)), store);

		// Assert
		expect(res).toBeObservable(cold('(a|)', { a: actions.expandSection('expand me pls') }));
	});

	it('should map to action with list of internalRefs for a nested section', () => {
		// Arrange
		const testNotepad = new FlatNotepad('test')
			.addSection({ title: 'test', internalRef: 'parent' })
			.addSection({ title: 'child', internalRef: 'expand me pls', parentRef: 'parent'});

		const params: NewNotepadObjectAction = {
			title: 'child',
			parent: 'parent'
		};

		store = mockStore({
			notepads: {
				notepad: {
					item: testNotepad
				}
			}
		} as IStoreState);

		// Act
		const res = ExplorerEpics.autoLoadNewSection$(ActionsObservable.of(actions.newSection(params)), store);

		// Assert
		expect(res).toBeObservable(cold('(a|)', { a: actions.expandSection('expand me pls') }));
	});
});
