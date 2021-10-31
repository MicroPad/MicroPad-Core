import { connect } from 'react-redux';
import SingletonModalComponent, { SingletonModalProps } from './SingletonModalComponent';
import { IStoreState } from '../../types';
import { actions } from '../../actions';

export const singletonModalConnector = connect(
	(state: IStoreState, ownProps: SingletonModalProps) => ({
		currentModalId: state.app.currentModalId
	}),
	(dispatch, ownProps) => ({
		openModal: (id: string) => dispatch(actions.openModal(id))
	})
);

export default singletonModalConnector(SingletonModalComponent);
