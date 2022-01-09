import { connect } from 'react-redux';
import NotepadDropdownComponent from './NotepadDropdownComponent';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { actions } from '../../../actions';

export const notepadDropdownConnector = connect(
	(state: IStoreState) => ({
		notepadTitles: state.notepads.savedNotepadTitles,
		syncState: state.sync
	}),
	dispatch => ({
		openNotepadFromStorage: (title: string) => dispatch(actions.openNotepadFromStorage.started(title)),
		newNotepad: notepad => dispatch(actions.newNotepad(notepad)),
		downloadNotepad: syncId => dispatch(actions.syncDownload.started(syncId))
	})
);

export default notepadDropdownConnector(NotepadDropdownComponent);
