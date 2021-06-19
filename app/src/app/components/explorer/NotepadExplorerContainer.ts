import { IStoreState } from '../../types';
import { connect } from 'react-redux';
import NotepadExplorerComponent from './NotepadExplorerComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';
import { FlatNotepad, Note, Notepad } from 'upad-parse/dist';
import { ThemeValues } from '../../ThemeValues';

let notepad: FlatNotepad | undefined;
let memoisedFullNotepad: Notepad | undefined;
export function mapStateToProps({ notepads, explorer, app, currentNote }: IStoreState) {
	let note: Note | undefined = undefined;
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad?.item?.notes[currentNote.ref];
	}

	const newNotepad = notepads.notepad?.item;
	if (notepad !== newNotepad) {
		memoisedFullNotepad = newNotepad?.toNotepad();
	}
	notepad = notepads.notepad?.item;

	return {
		notepad: memoisedFullNotepad,
		openSections: explorer.openSections,
		isFullScreen: app.isFullScreen,
		openNote: note,
		theme: ThemeValues[app.theme],
		isReadOnly: !!notepads?.notepad?.isReadOnly,
		explorerWidth: app.explorerWidth
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		flipFullScreenState: () => dispatch(actions.flipFullScreenState(undefined)),
		loadNote: (ref: string) => dispatch(actions.loadNote.started(ref)),
		expandSection: (guid: string) => dispatch(actions.expandSection(guid)),
		collapseSection: (guid: string) => dispatch(actions.collapseSelection(guid)),
		expandAll: () => dispatch(actions.expandAllExplorer.started(undefined)),
		collapseAll: () => dispatch(actions.collapseAllExplorer(undefined)),
		newSection: obj => dispatch(actions.newSection(obj)),
		newNote: obj => dispatch(actions.newNote(obj)),
		expandFromNote: note => {
			if (!notepad) return;
			dispatch(actions.expandFromNote({
				notepad,
				note: notepad.notes[note.internalRef]
			}));
		},
		setExplorerWidth: (newWidth: string) => dispatch(actions.setExplorerWidth(newWidth))
	};
}

export const notepadExplorerConnector = connect(mapStateToProps, mapDispatchToProps);
export default notepadExplorerConnector(NotepadExplorerComponent);
