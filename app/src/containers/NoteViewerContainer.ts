import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import {
	default as NoteViewerComponent,
	INoteViewerComponentProps
} from '../components/note-viewer/NoteViewerComponent';
import { actions } from '../actions';
import { ThemeValues } from '../ThemeValues';

let noteRef: string = '';

export function mapStateToProps({ notepads, currentNote, meta }: IStoreState) {
	noteRef = currentNote.ref;

	let note;
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
	}

	return {
		isFullscreen: meta.isFullScreen,
		zoom: meta.zoom,
		note,
		noteAssets: currentNote.assetUrls,
		elementEditing: currentNote.elementEditing,
		isNotepadOpen: !!notepads.notepad && !!notepads.notepad.item,
		isLoading: currentNote.isLoading || notepads.isLoading || (!!notepads.notepad && notepads.notepad.isLoading),
		theme: ThemeValues[meta.theme]
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
		toggleInsertMenu: opts => dispatch(actions.toggleInsertMenu(opts))
	};
}

export default connect<INoteViewerComponentProps>(mapStateToProps, mapDispatchToProps)(NoteViewerComponent);
