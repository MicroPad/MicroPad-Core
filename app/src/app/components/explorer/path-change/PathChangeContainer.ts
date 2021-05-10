import { IStoreState } from '../../../types';
import { connect } from 'react-redux';
import PathChangeComponent from './PathChangeComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../../../actions';

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
