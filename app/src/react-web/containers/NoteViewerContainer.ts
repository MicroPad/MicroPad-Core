import { IStoreState } from '../../core/types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import {
	default as NoteViewerComponent,
	INoteViewerComponentProps
} from '../components/note-viewer/NoteViewerComponent';
import { actions } from '../../core/actions';
import { ThemeValues } from '../ThemeValues';
import { Note } from 'upad-parse/dist';

let noteRef: string = '';
let note: Note | null;
let notepadTitle: string = '';

export function mapStateToProps({ notepads, currentNote, app }: IStoreState) {
	noteRef = currentNote.ref;

	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
		notepadTitle = notepads.notepad!.item!.title;
	} else {
		note = null;
	}

	return {
		isFullscreen: app.isFullScreen,
		zoom: app.zoom,
		note,
		noteAssets: currentNote.assetUrls,
		elementEditing: currentNote.elementEditing,
		isNotepadOpen: !!notepads.notepad && !!notepads.notepad.item,
		isLoading: currentNote.isLoading || notepads.isLoading || (!!notepads.notepad && notepads.notepad.isLoading),
		theme: ThemeValues[app.theme]
	} as INoteViewerComponentProps;
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INoteViewerComponentProps> {
	return {
		search: query => dispatch(actions.search(query)),
		downloadAsset: (filename, uuid) => dispatch(actions.downloadAsset.started({ filename, uuid })),
		edit: id => dispatch(actions.openEditor(id)),
		deleteElement: elementId => dispatch(actions.deleteElement({ elementId, noteRef })),
		updateElement: (id, changes, newAsset) => dispatch(
			actions.updateElement({
				elementId: id,
				element: changes,
				noteRef,
				newAsset
			})
		),
		toggleInsertMenu: opts => dispatch(actions.toggleInsertMenu(opts)),
		insert: element => dispatch(actions.insertElement({
			element: {
				...element,
				args: {
					...element.args,
					id: `${element.type}${note!.elements.filter(e => e.type === element.type).length + 1}`
				}
			},
			noteRef
		})),
		makeQuickNotepad: () => dispatch(actions.quickNotepad(undefined)),
		makeQuickNote: () => dispatch(actions.quickNote.started(undefined)),
		deleteNotepad: () => dispatch(actions.deleteNotepad(notepadTitle))
	};
}

export default connect<INoteViewerComponentProps>(mapStateToProps, mapDispatchToProps)(NoteViewerComponent);
