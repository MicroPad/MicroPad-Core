import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import {
	default as InsertElementComponent,
	IInsertElementComponentProps
} from '../components/note-viewer/InsertElementComponent';
import { Note } from 'upad-parse/dist';
import { ThemeValues } from '../ThemeValues';

export function mapStateToProps({ notepads, currentNote, app }: IStoreState) {
	let note = {} as Note;
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
	}

	const explorerWidth = parseInt(app.explorerWidth, 10);

	return {
		note,
		x: currentNote.insertElement.x,
		y: currentNote.insertElement.y,
		enabled: currentNote.insertElement.enabled,
		fontSize: app.defaultFontSize,
		theme: ThemeValues[app.theme],
		isFullScreen: app.isFullScreen,
		explorerWidth: explorerWidth
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IInsertElementComponentProps> {
	return {
		insert: action => dispatch(actions.insertElement(action)),
		toggleInsertMenu: opts => dispatch(actions.toggleInsertMenu(opts)),
		edit: id => dispatch(actions.openEditor(id))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(InsertElementComponent);
