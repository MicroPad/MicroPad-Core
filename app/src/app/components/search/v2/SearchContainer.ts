import { connect } from 'react-redux';
import SearchComponent from './SearchComponent';
import { IStoreState } from '../../../types';

export const searchConnector = connect(
	({ search, notepads }: IStoreState) => ({
		notepad: notepads.notepad?.item,
		indices: search.indices,
		results: search.results,
		query: search.query
	})
);

export default searchConnector(SearchComponent);
