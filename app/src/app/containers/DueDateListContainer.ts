import { IStoreState } from '../types';
import DueDateListComponent, { IDueDateListComponentProps } from '../components/explorer/DueDateListComponent';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads }: IStoreState): IDueDateListComponentProps {
	// const currentTitle = notepads.notepad?.item?.title; TODO: Figure out why it won't let me build with optional chaining
	const currentTitle = ((notepads.notepad || {} as any).item || {} as any).title;

	return {
		isLoading: notepads.dueDates.isLoading,
		dueItems: notepads.dueDates.dueItems,
		currentTitle
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IDueDateListComponentProps> {
	return {
		loadNote: (data, currentNotepadTitle) => {
			if (currentNotepadTitle === data.notepadTitle) {
				dispatch(actions.loadNote.started(data.noteRef));
			} else {
				dispatch(actions.restoreJsonNotepadAndLoadNote(data));
			}
		}
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(DueDateListComponent);
