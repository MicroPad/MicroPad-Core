import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import SourcesComponent, { ISourcesComponent } from '../components/note-viewer/SourcesComponent';
import { actions } from '../actions';
import { Note } from 'upad-parse/dist';

let noteRef: string = '';
export function mapStateToProps({ notepads, currentNote }: IStoreState) {
	noteRef = currentNote.ref;

	let note = <Note> {};
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
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

export default connect(mapStateToProps, mapDispatchToProps)(SourcesComponent);
