import { connect } from 'react-redux';
import SearchComponent from './SearchComponent';
import { IStoreState } from '../../../types';
import { Dispatch } from 'redux';
import { actions, MicroPadAction } from '../../../actions';

export const searchConnector = connect(
	({ search, notepads }: IStoreState) => {
		return {
			notepad: notepads.notepad?.item,
			query: search.query,
			results: search.results,
		};
	},
	(dispatch: Dispatch<MicroPadAction>) => ({
		search: (query: string) => dispatch(actions.search.started(query))
	})
);

export default searchConnector(SearchComponent);
