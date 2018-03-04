import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { INote, INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { Action } from 'redux';
import { ISearchComponentProps, default as SearchComponent } from '../components/search/SearchComponent';
import { actions } from '../actions';

export function mapStateToProps({ notepads, search }: IStoreState) {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item!,
		hashTagResults: search.hashTagResults,
		query: search.query
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISearchComponentProps> {
	return {
		loadNote: (note: INote) => dispatch(actions.loadNote(note)),
		search: (query: string) => dispatch(actions.search(query))
	};
}

export default connect<ISearchComponentProps>(mapStateToProps, mapDispatchToProps)(SearchComponent);
