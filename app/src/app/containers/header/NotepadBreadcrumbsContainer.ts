import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadBreadcrumbsComponent, {
	Breadcrumb,
	INotepadBreadcrumbsProps
} from '../../components/header/NotepadBreadcrumbsComponent/NotepadBreadcrumbsComponent';
import { INotepadStoreState } from '../../types/NotepadTypes';
import { format } from 'date-fns';
import { FlatNotepad } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';

export function mapStateToProps({ notepads, currentNote, app }: IStoreState): INotepadBreadcrumbsProps {
	let breadcrumbs: Breadcrumb[] = [];
	let time: string | undefined = undefined;

	const makeCrumb = (title: string): Breadcrumb => ({ text: title });

	if (currentNote.ref.length === 0) {
		breadcrumbs.push(
			makeCrumb(
				((notepads.notepad || <INotepadStoreState> {}).item || <FlatNotepad> {}).title
				|| 'Create a quick notebook below, or open/create a notebook using the drop-down/sidebar to start'
			)
		);
	} else {
		const note = notepads.notepad!.item!.notes[currentNote.ref];
		if (!note) return { themeName: app.theme, breadcrumbs: [{ text: 'Error loading note' }] };

		// Get parent list up the tree
		breadcrumbs = [
			...notepads.notepad!.item!.pathFrom(note).map(parent => ({
				text: parent.title,
				ref: (parent as FlatSection).internalRef
			})),
			{ text: note.title, ref: note.internalRef }
		];

		if (breadcrumbs.length > 1) {
			time = format(new Date(note.time), 'dddd, D MMMM YYYY h:mm A');
		}
	}

	return {
		themeName: app.theme,
		breadcrumbs,
		noteTime: time
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INotepadBreadcrumbsProps> {
	return {
		focusItem: ref => {
			if (!!ref) dispatch(actions.openBreadcrumb(ref));
		}
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(NotepadBreadcrumbsComponent);
