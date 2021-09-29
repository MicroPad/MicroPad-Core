import { connect } from 'react-redux';
import NotepadDropdownComponent from './NotepadDropdownComponent';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { actions } from '../../../actions';

export const notepadDropdownConnector = connect(
	(state: IStoreState) => ({
		isExporting: state.isExporting.isLoading,
		notepadTitles: state.notepads.savedNotepadTitles,
		syncState: state.sync,
		theme: ThemeValues[state.app.theme]
	}),
	dispatch => ({
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title)),
		newNotepad: notepad => dispatch(actions.newNotepad(notepad)),
		exportAll: () => dispatch(actions.exportAll.started()),
		exportToMarkdown: () => dispatch(actions.exportToMarkdown.started()),
		downloadNotepad: syncId => dispatch(actions.syncDownload.started(syncId))
	})
);

export default notepadDropdownConnector(NotepadDropdownComponent);
