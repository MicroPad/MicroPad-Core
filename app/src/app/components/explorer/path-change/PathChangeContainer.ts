import { IStoreState } from '../../../types';
import { connect } from 'react-redux';
import PathChangeComponent from './PathChangeComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../../../actions';
import { FlatNotepad } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';

type DispatchProps = {
	moveObj: (ref: string, newParent: string, type: 'section' | 'note') => void
};

function mapStateToProps({ notepads }: IStoreState) {
	return { notepad: notepads?.notepad?.item };
}

function mapDispatchToProps(dispatch: Dispatch<Action>): DispatchProps {
	return {
		moveObj: (ref, newParent, type) => dispatch(actions.moveNotepadObject({
			objectRef: ref,
			newParent,
			type
		}))
	};
}

export const pathChangeConnector = connect(mapStateToProps, mapDispatchToProps);
export default pathChangeConnector(PathChangeComponent);

export function getParentList(notepad: FlatNotepad, internalRef: string): Array<Array<FlatNotepad | FlatSection>> {
	return [
		[notepad],
		...Object.values(notepad.sections)
			.map((section: FlatSection) => [...notepad.pathFrom(section), section])
			.filter(items => !items.some((item: unknown) => {
				// Exclude any options which could result on a section being moved into itself
				const section = item as FlatSection;
				return !!section.internalRef && section.internalRef === internalRef;
			}))
	];
}
