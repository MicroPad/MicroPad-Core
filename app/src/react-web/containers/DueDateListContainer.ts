import { IStoreState } from '../../core/types';
import DueDateListComponent, { DueItem, IDueDateListComponentProps } from '../components/explorer/DueDateListComponent';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../../core/actions';

export function mapStateToProps({ notepads }: IStoreState): IDueDateListComponentProps {
	const notepad = (notepads.notepad || {} as INotepadStoreState).item;
	if (!notepad) return { dueItems: [] };

	return {
		dueItems: Object.values(notepad.notes)
			.map(note => {
				const earliestDueDate = note.elements
					.map(element => element.args.dueDate)
					.filter(dueDate => !!dueDate)
					.map(dueDate => parseInt(dueDate!, 10))
					.filter(due => due >= new Date().getTime())
					.sort()[0];

				return {
					note,
					date: !!earliestDueDate ? new Date(earliestDueDate) : undefined
				};
			})
			.filter((dueItem: Partial<DueItem>): dueItem is DueItem => !!dueItem.date)
			.sort((a, b) => a.date.getTime() - b.date.getTime())
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IDueDateListComponentProps> {
	return {
		loadNote: ref => dispatch(actions.loadNote.started(ref))
	};
}

export default connect<IDueDateListComponentProps>(mapStateToProps, mapDispatchToProps)(DueDateListComponent);
