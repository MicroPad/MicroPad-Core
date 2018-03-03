import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import NotepadExplorerComponent, { INotepadExplorerComponentProps } from '../components/explorer/NotepadExplorerComponent';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { Action } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads, currentNote, meta }: IStoreState) {
	return {
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item,
		currentNote: currentNote.item,
		isFullScreen: meta.isFullScreen
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		flipFullScreenState: () => dispatch(actions.flipFullScreenState(undefined)),
		deleteNotepad: (title: string) => dispatch(actions.deleteNotepad(title))
	};
}

export default connect<INotepadExplorerComponentProps>(mapStateToProps, mapDispatchToProps)(NotepadExplorerComponent);
