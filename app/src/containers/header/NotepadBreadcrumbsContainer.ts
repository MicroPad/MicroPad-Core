import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadBreadcrumbsComponent, { INotepadBreadcrumbsProps } from '../../components/header/NotepadBreadcrumbsComponent/NotepadBreadcrumbsComponent';
import { INotepadStoreState } from '../../types/NotepadTypes';
import { format } from 'date-fns';
import { FlatNotepad } from 'upad-parse/dist';

export function mapStateToProps({ notepads, currentNote, meta }: IStoreState): INotepadBreadcrumbsProps {
	let breadcrumbs: string[] = [];
	let time: string | undefined = undefined;

	if (currentNote.ref.length === 0) {
		breadcrumbs.push(((notepads.notepad || <INotepadStoreState> {}).item || <FlatNotepad> {}).title
			|| 'Open/Create a notepad using the drop-down or the sidebar to start');
	} else {
		const note = notepads.notepad!.item!.notes[currentNote.ref];
		if (!note) return { themeName: meta.theme, breadcrumbs: ['Error loading note'] };

		// Get parent list up the tree
		breadcrumbs = [
			...notepads.notepad!.item!.pathFrom(note).map(parent => parent.title),
			note.title
		];

		if (breadcrumbs.length > 1) {
			time = format(new Date(note.time), 'dddd, D MMMM h:mm A');
		}
	}

	return {
		themeName: meta.theme,
		breadcrumbs,
		noteTime: time
	};
}

export default connect<INotepadBreadcrumbsProps>(mapStateToProps)(NotepadBreadcrumbsComponent);
