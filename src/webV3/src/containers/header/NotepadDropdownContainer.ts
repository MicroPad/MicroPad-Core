import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadDropdownComponent from '../../components/header/NotepadDropdownComponent';

export function mapStateToProps({ notepads }: IStoreState) {
	return {
		notepadTitles: notepads.savedNotepadTitles
	};
}

export default connect(mapStateToProps)(NotepadDropdownComponent);
