import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import { connect } from 'react-redux';
import PathChangeComponent, { IPathChangeComponentProps } from '../components/explorer/PathChangeComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads }: IStoreState): IPathChangeComponentProps {
	const notepad = ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item;

	return {
		notepad: notepad
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IPathChangeComponentProps> {
	return {
		moveObj: (ref, newParent, type) => dispatch(actions.moveNotepadObject({
			objectRef: ref,
			newParent,
			type
		}))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(PathChangeComponent);
