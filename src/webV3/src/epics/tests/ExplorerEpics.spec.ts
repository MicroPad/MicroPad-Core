import { createEpicMiddleware } from 'redux-observable';
import * as configureStore from 'redux-mock-store';
import { ExplorerEpics } from '../ExplorerEpics';
import { actions } from '../../actions';
import { cold } from 'jest-marbles';
import { Observable } from 'rxjs/Observable';
import { Action } from 'redux-typescript-actions';
import { IStoreState } from '../../types';
import { ineeda } from 'ineeda';
import { INote, IParent, ISection } from '../../types/NotepadTypes';
import { INewNotepadObjectAction } from '../../types/ActionTypes';

const epic = createEpicMiddleware(ExplorerEpics.explorerEpics$);
const mockStore = configureStore([epic]);

let store;

afterEach(() => {
	epic.replaceEpic(ExplorerEpics.explorerEpics$);
});

describe('expandAll$', () => {
	beforeEach(() => {
		store = mockStore(ineeda<IStoreState>({
			notepads: {
				notepad: {
					item: {
						sections: [
							<ISection> {
								internalRef: 'test1',
								sections: <ISection[]> [
									<ISection> {
										internalRef: 'test2',
										sections: <ISection[]> [],
										notes: <INote[]> []
									}
								],
								notes: <INote[]> []
							},
							<ISection> {
								internalRef: 'test3',
								sections: <ISection[]> [],
								notes: <INote[]> []
							}
						]
					}
				}
			}
		}));

	});

	it('should map to action with list of internalRefs', () => {
		// Arrange
		const res: Observable<Action<string[]>> = ExplorerEpics.expandAll$(cold('a', {
			a: actions.expandAllExplorer.started(undefined)
		}), store);

		// Act
		res.subscribe();

		// Assert
		expect(res).toBeObservable(cold('a', { a: actions.expandAllExplorer.done({
				params: undefined,
				result: ['test1', 'test2', 'test3']
		})}));
	});
});

describe('autoLoadNewSection$', () => {
	it('should map to action with list of internalRefs', () => {
		// Arrange
		const mockNotepad: Partial<IParent> = {
			sections: <ISection[]> [
				{
					parent: <IParent> {},
					internalRef: 'expand me pls',
					title: 'test',
					sections: <ISection[]> [],
					notes: <INote[]> []
				}
			]
		};
		mockNotepad.sections![0].parent = <IParent> mockNotepad;

		const params: INewNotepadObjectAction = {
			title: 'test',
			parent: <IParent> mockNotepad
		};

		store = mockStore(ineeda<IStoreState>({
			notepads: {
				notepad: {
					item: mockNotepad
				}
			}
		}));

		const res: Observable<Action<string[]>> = ExplorerEpics.autoLoadNewSection$(cold('a', {
			a: actions.newSection(params)
		}), store);

		// Act
		res.subscribe();

		// Assert
		expect(res).toBeObservable(cold('a', { a: actions.expandSection('expand me pls') }));
	});
});
