import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadBreadcrumbsComponent, {
	Breadcrumb,
	INotepadBreadcrumbsProps
} from '../../components/header/NotepadBreadcrumbsComponent/NotepadBreadcrumbsComponent';
import { format } from 'date-fns';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';
import { FlatNotepad } from 'upad-parse';

let oldNotepad: FlatNotepad | undefined = undefined;
let oldNoteRef: string | undefined = undefined;
let memoisedState: INotepadBreadcrumbsProps | undefined;
export function mapStateToProps({ notepads, currentNote }: IStoreState): INotepadBreadcrumbsProps {
	let breadcrumbs: Breadcrumb[] = [];
	let time: string | undefined = undefined;

	const makeCrumb = (title: string): Breadcrumb => ({ text: title });
	const fallback = makeCrumb(
		notepads.notepad?.item?.title
		?? 'Create a quick notebook below, or open/create a notebook using the drop-down/sidebar to start'
	);

	if (notepads?.notepad?.item === oldNotepad && currentNote.ref === oldNoteRef) {
		if (memoisedState) return memoisedState;
		memoisedState = { breadcrumbs: [fallback] };
		return memoisedState;
	}
	oldNotepad = notepads?.notepad?.item;
	oldNoteRef = currentNote.ref;

	if (currentNote.ref.length === 0) {
		breadcrumbs.push(fallback);
	} else {
		const note = notepads.notepad!.item!.notes[currentNote.ref];
		if (!note) return { breadcrumbs: [{ text: 'Error loading note' }] };

		// Get parent list up the tree
		breadcrumbs = [
			...notepads.notepad!.item!.pathFrom(note).map(parent => ({
				text: parent.title,
				ref: (parent as FlatSection).internalRef
			})),
			{ text: note.title, ref: note.internalRef }
		];

		if (breadcrumbs.length > 1) {
			time = format(new Date(note.time), 'EEEE, d LLLL yyyy p');
		}
	}

	const res: INotepadBreadcrumbsProps = {
		breadcrumbs,
		hasNotebookOpen: !!notepads?.notepad?.item,
		noteTime: time
	};
	memoisedState = res;

	return res;
}

function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<INotepadBreadcrumbsProps> {
	return {
		focusItem: ref => {
			if (!!ref) {
				dispatch(actions.openBreadcrumb(ref));
			} else {
				dispatch(actions.closeNote());
				dispatch(actions.collapseAllExplorer());
			}
		}
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(NotepadBreadcrumbsComponent);
