import { connect } from 'react-redux';
import { IStoreState } from '../../types';
import NotepadBreadcrumbsComponent, { INotepadBreadcrumbsProps } from '../../components/header/NotepadBreadcrumbsComponent/NotepadBreadcrumbsComponent';
import { INote, INotepad, INotepadStoreState, ISection } from '../../types/NotepadTypes';

export function mapStateToProps({ notepads, currentNote }: IStoreState) {
	const breadcrumbs: string[] = [];

	if (!currentNote.item) {
		breadcrumbs.push(((notepads.notepad || <INotepadStoreState> {}).item || <INotepad> {}).title
			|| 'Open/Create a notepad using the drop-down or the sidebar to start');
	} else {
		// Get parent list up the tree
		let parent: ISection | INote = currentNote.item;

		while (!!parent.parent) {
			breadcrumbs.unshift(parent.title);
			parent = <ISection | INote> parent.parent;
		}

		breadcrumbs.unshift(parent.title);
	}

	return {
		breadcrumbs
	};
}

export default connect<INotepadBreadcrumbsProps>(mapStateToProps)(NotepadBreadcrumbsComponent);
