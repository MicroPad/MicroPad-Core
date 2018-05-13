import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import { getNotepadObjectByRef } from '../util';
import { INote } from '../types/NotepadTypes';
import SourcesComponent, { ISourcesComponent } from '../components/note-viewer/SourcesComponent';
import { actions } from '../actions';

let noteRef: string = '';
export function mapStateToProps({ notepads, currentNote }: IStoreState) {
	noteRef = currentNote.ref;

	let note = <INote> {};
	if (currentNote.ref.length !== 0) {
		getNotepadObjectByRef(notepads.notepad!.item!, currentNote.ref, obj => note = <INote> obj);
	}

	return {
		note,
		element: note.elements.filter(e => e.args.id === currentNote.elementEditing)[0]
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISourcesComponent> {
	return {
		updateBibliography: bibliography => dispatch(actions.updateBibliography({ sources: bibliography, noteRef }))
	};
}

export default connect<ISourcesComponent>(mapStateToProps, mapDispatchToProps)(SourcesComponent);
