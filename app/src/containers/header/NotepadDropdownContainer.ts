import { connect, Dispatch } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadDropdownComponent, { INotepadDropdownProps } from '../../components/header/NotepadDropdownComponent';
import { actions } from '../../actions';
import { Action } from 'redux';
import { INotepad } from '../../types/NotepadTypes';

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INotepadDropdownProps> {
	return {
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title)),
		newNotepad: (notepad: INotepad) => dispatch(actions.newNotepad(notepad)),
		exportAll: () => dispatch(actions.exportAll(undefined)),
		exportToMarkdown: () => dispatch(actions.exportToMarkdown(undefined)),
		downloadNotepad: syncId => dispatch(actions.syncDownload.started(syncId))
	};
}

export function mapStateToProps({ notepads, sync }: IStoreState) {
	return {
		notepadTitles: notepads.savedNotepadTitles,
		syncState: sync
	};
}

export default connect<INotepadDropdownProps>(mapStateToProps, mapDispatchToProps)(NotepadDropdownComponent);
