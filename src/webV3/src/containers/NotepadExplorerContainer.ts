import { IStoreState } from '../types';
import { connect } from 'react-redux';
import NotepadExplorerComponent, { INotepadExplorerComponentProps } from '../components/explorer/NotepadExplorerComponent';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';

export function mapStateToProps({ notepads, currentNote }: IStoreState): INotepadExplorerComponentProps {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item,
		currentNote: currentNote.item
	};
}

export default connect<INotepadExplorerComponentProps>(mapStateToProps)(NotepadExplorerComponent);
