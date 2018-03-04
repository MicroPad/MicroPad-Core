import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { Action } from 'redux';
import { ISearchComponentProps, default as SearchComponent } from '../components/search/SearchComponent';

export function mapStateToProps({ notepads }: IStoreState) {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item!
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISearchComponentProps> {
	return {};
}

export default connect<ISearchComponentProps>(mapStateToProps, mapDispatchToProps)(SearchComponent);
