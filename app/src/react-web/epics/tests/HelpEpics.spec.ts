import { ActionsObservable } from 'redux-observable';
import { HelpEpics } from '../HelpEpics';
import { cold, hot } from 'jest-marbles';
import { actions } from '../../../core/actions';
import { Store } from 'redux';
import { IStoreState } from '../../../core/types';
import { EpicDeps } from '../index';
import { Dialog } from '../../dialogs';

describe('HelpEpics', () => {
	describe('getHelp$', () => {
		it(`should dispatch GET_HELP_DONE if there is no help notepad`, () => {
			// Arrange
			const mockStore = {
				getState: () => ({
					notepads: { savedNotepadTitles: ['not help', 'not help either'] }
				})
			} as Store<IStoreState>;

			const deps = {} as EpicDeps;

			// Act
			const res = HelpEpics.getHelp$(
				ActionsObservable.of(actions.getHelp.started()),
				mockStore,
				deps
			);

			// Assert
			res.subscribe(action =>
				expect(action).toEqual(actions.getHelp.done({ params: undefined, result: undefined }))
			);
		});

		it(`should dispatch GET_HELP_DONE if the user agrees to overwrite`, () => {
			// Arrange
			const mockStore = {
				getState: () => ({
					notepads: { savedNotepadTitles: ['Help', 'not help', 'not help either'] }
				})
			} as Store<IStoreState>;

			const deps = {
				Dialog: {
					confirm: _ => new Promise(r => r(true))
				} as Dialog
			} as EpicDeps;

			// Act
			const res = HelpEpics.getHelp$(
				ActionsObservable.of(actions.getHelp.started()),
				mockStore,
				deps
			);

			// Assert
			res.subscribe(action =>
				expect(action).toEqual(actions.getHelp.done({ params: undefined, result: undefined }))
			);
		});
	});

	describe('getHelpSuccess$', () => {
		it(`should dispatch PARSE_NPX_STARTED with the help notepad's xml`, () => {
			// Arrange
			const helpNpx = 'this is the help notepad for realsies';

			const mockStore = {} as Store<IStoreState>;

			const deps = { helpNpx } as EpicDeps;

			// Act
			const res = HelpEpics.getHelpSuccess$(
				ActionsObservable.of(actions.getHelp.done({ params: undefined, result: undefined })),
				mockStore,
				deps
			);

			// Assert
			expect(res).toBeObservable(cold('(a|)', {
				a: actions.parseNpx.started(helpNpx)
			}));
		});
	});
});
