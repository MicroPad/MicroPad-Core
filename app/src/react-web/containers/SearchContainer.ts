import { IStoreState } from '../../core/types';
import { connect } from 'react-redux';
import { INotepadsStoreState, INotepadStoreState } from '../../core/types/NotepadTypes';
import { Action, Dispatch } from 'redux';
import { default as SearchComponent, ISearchComponentProps } from '../components/search/SearchComponent';
import { actions } from '../../core/actions';

export function mapStateToProps({ notepads, search }: IStoreState) {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item,
		indices: search.indices,
		hashTagResults: search.hashTagResults,
		query: search.query
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISearchComponentProps> {
	return {
		loadNote: (ref: string) => dispatch(actions.loadNote.started(ref)),
		search: (query: string) => dispatch(actions.search(query)),
		loadNoteFromHashTagResults: data => dispatch(actions.restoreJsonNotepadAndLoadNote(data))
	};
}

export default connect<ISearchComponentProps>(mapStateToProps, mapDispatchToProps)(SearchComponent);
