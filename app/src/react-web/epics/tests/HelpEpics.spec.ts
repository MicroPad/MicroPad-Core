import { ActionsObservable } from 'redux-observable';
import { HelpEpics } from '../HelpEpics';
import { cold } from 'jest-marbles';
import { actions } from '../../../core/actions';

describe('getHelp$', () => {
	it(`should dispatch PARSE_NPX_STARTED with the help notepad's xml`, () => {
		// Arrange
		const helpNpx = 'this is the help notepad for realsies';

		// Act
		const res = HelpEpics.getHelp$(ActionsObservable.of(actions.getHelp(undefined)), null, { helpNpx });

		// Assert
		expect(res).toBeObservable(cold('(a|)', {
			a: actions.parseNpx.started(helpNpx)
		}));
	});
});
