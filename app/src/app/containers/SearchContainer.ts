import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { default as SearchComponent, ISearchComponentProps } from '../components/search/SearchComponent';
import { actions } from '../actions';

export function mapStateToProps({ notepads, search }: IStoreState) {
	return {
		notepad: notepads?.notepad?.item,
		indices: search.indices,
		query: search.query,
		results: search.results
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISearchComponentProps> {
	return {
		loadNote: (ref: string) => dispatch(actions.loadNote.started(ref)),
		search: (query: string) => dispatch(actions.search.started(query)),
		loadNoteFromHashTagResults: data => dispatch(actions.restoreJsonNotepadAndLoadNote(data))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchComponent);
