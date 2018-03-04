import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import NotepadExplorerComponent, { INotepadExplorerComponentProps } from '../components/explorer/NotepadExplorerComponent';
import { INote, INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { Action } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads, currentNote, meta }: IStoreState) {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item,
		currentNote: currentNote.item,
		isFullScreen: meta.isFullScreen
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INotepadExplorerComponentProps> {
	return {
		flipFullScreenState: () => dispatch(actions.flipFullScreenState(undefined)),
		deleteNotepad: (title: string) => dispatch(actions.deleteNotepad(title)),
		exportNotepad: () => dispatch(actions.exportNotepad(undefined)),
		loadNote: (note: INote) => dispatch(actions.loadNote(note))
	};
}

export default connect<INotepadExplorerComponentProps>(mapStateToProps, mapDispatchToProps)(NotepadExplorerComponent);
