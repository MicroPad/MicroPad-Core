import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import {
	default as NoteViewerComponent,
	INoteViewerComponentProps
} from '../components/note-viewer/NoteViewerComponent';
import { getNotepadObjectByRef } from '../util';
import { INote } from '../types/NotepadTypes';

export function mapStateToProps({ notepads, currentNote, meta }: IStoreState) {
	let note;
	if (currentNote.length !== 0) {
		getNotepadObjectByRef(notepads.notepad!.item!, currentNote, obj => note = <INote> obj);
	}

	return {
		isFullscreen: meta.isFullScreen,
		note
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INoteViewerComponentProps> {
	return {};
}

export default connect<INoteViewerComponentProps>(mapStateToProps, mapDispatchToProps)(NoteViewerComponent);
