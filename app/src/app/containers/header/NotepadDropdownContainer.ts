import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadDropdownComponent, { INotepadDropdownProps } from '../../components/header/NotepadDropdownComponent';
import { actions } from '../../actions';
import { Action, Dispatch } from 'redux';
import { ThemeValues } from '../../ThemeValues';

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INotepadDropdownProps> {
	return {
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title)),
		newNotepad: notepad => dispatch(actions.newNotepad(notepad)),
		exportAll: () => dispatch(actions.exportAll.started(undefined)),
		exportToMarkdown: () => dispatch(actions.exportToMarkdown.started(undefined)),
		downloadNotepad: syncId => dispatch(actions.syncDownload.started(syncId))
	};
}

export function mapStateToProps({ notepads, sync, isExporting, app }: IStoreState) {
	return {
		isExporting: isExporting.isLoading,
		notepadTitles: notepads.savedNotepadTitles,
		syncState: sync,
		theme: ThemeValues[app.theme]
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(NotepadDropdownComponent);
