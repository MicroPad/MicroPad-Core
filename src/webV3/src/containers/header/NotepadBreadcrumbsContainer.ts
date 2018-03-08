import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadBreadcrumbsComponent, { INotepadBreadcrumbsProps } from '../../components/header/NotepadBreadcrumbsComponent/NotepadBreadcrumbsComponent';
import { INote, INotepad, INotepadStoreState, ISection } from '../../types/NotepadTypes';
import { format } from 'date-fns';
import { getNotepadObjectByRef } from '../../util';

export function mapStateToProps({ notepads, currentNote }: IStoreState): INotepadBreadcrumbsProps {
	const breadcrumbs: string[] = [];
	let time: string | undefined = undefined;

	if (currentNote.length === 0) {
		breadcrumbs.push(((notepads.notepad || <INotepadStoreState> {}).item || <INotepad> {}).title
			|| 'Open/Create a notepad using the drop-down or the sidebar to start');
	} else {
		let note: INote | false = false;
		getNotepadObjectByRef(notepads.notepad!.item!, currentNote, obj => note = <INote> obj);
		if (!note) return { breadcrumbs: ['Error loading note'] };
		note = <INote> note;

		// Get parent list up the tree
		let parent: ISection | INote = note;

		while (!!parent.parent) {
			breadcrumbs.unshift(parent.title);
			parent = <ISection | INote> parent.parent;
		}

		breadcrumbs.unshift(parent.title);

		if (breadcrumbs.length > 1) {
			time = format(new Date(note.time), 'dddd, D MMMM h:mm A');
		}
	}

	return {
		breadcrumbs,
		noteTime: time
	};
}

export default connect<INotepadBreadcrumbsProps>(mapStateToProps)(NotepadBreadcrumbsComponent);
