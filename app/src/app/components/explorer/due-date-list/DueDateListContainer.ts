import { IStoreState } from '../../../types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../../../actions';
import { DueItem } from '../../../services/DueDates';
import { RestoreJsonNotepadAndLoadNoteAction } from '../../../types/ActionTypes';
import DueDateListComponent from './DueDateListComponent';

type StateProps = {
	currentTitle?: string,
	isLoading: boolean,
	dueItems: DueItem[]
};

type DispatchProps = {
	loadNote: (data: RestoreJsonNotepadAndLoadNoteAction, currentNotepadTitle?: string) => void
};

function mapStateToProps({ notepads }: IStoreState): StateProps {
	const currentTitle = notepads.notepad?.item?.title;

	return {
		isLoading: notepads.dueDates.isLoading,
		dueItems: notepads.dueDates.dueItems,
		currentTitle
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): DispatchProps {
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

export const dueDateListConnector = connect(mapStateToProps, mapDispatchToProps);
export default dueDateListConnector(DueDateListComponent);
