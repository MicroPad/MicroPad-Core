import { connect, Dispatch } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadDropdownComponent, { INotepadDropdownProps } from '../../components/header/NotepadDropdownComponent';
import { actions } from '../../actions';
import { Action } from 'redux';

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title))
	};
}

export function mapStateToProps({ notepads }: IStoreState) {
	return {
		notepadTitles: notepads.savedNotepadTitles
	};
}

export default connect<INotepadDropdownProps>(mapStateToProps, mapDispatchToProps)(NotepadDropdownComponent);
