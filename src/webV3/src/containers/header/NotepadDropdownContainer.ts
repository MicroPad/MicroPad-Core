import { connect, Dispatch } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadDropdownComponent, { INotepadDropdownProps } from '../../components/header/NotepadDropdownComponent';
import { actions } from '../../actions';
import { Action } from 'redux';
import { INotepad } from '../../types/NotepadTypes';

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title)),
		newNotepad: (notepad: INotepad) => dispatch(actions.newNotepad(notepad)),
		exportAll: () => dispatch(actions.exportAll(undefined))
	};
}

export function mapStateToProps({ notepads }: IStoreState) {
	return {
		notepadTitles: notepads.savedNotepadTitles
	};
}

export default connect<INotepadDropdownProps>(mapStateToProps, mapDispatchToProps)(NotepadDropdownComponent);
