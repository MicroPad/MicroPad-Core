import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { Action, Dispatch } from 'redux';
import { default as SearchComponent, ISearchComponentProps } from '../components/search/SearchComponent';
import { actions } from '../actions';

export function mapStateToProps({ notepads, search }: IStoreState) {
	return {
		notepad: ((notepads || {} as INotepadsStoreState).notepad || {} as INotepadStoreState).item,
		indices: search.indices,
		results: search.results,
		query: search.query
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
