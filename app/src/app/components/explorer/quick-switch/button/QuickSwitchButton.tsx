import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import Button2 from '../../../Button';
import { actions } from '../../../../actions';

const connector = connect(_state => ({}), dispatch => ({
	openModal: () => dispatch(actions.openModal('quick-switch-modal'))
}));

const component = (props: ConnectedProps<typeof connector>) =>
	<Button2 flat onClick={props.openModal}>Quick notebook switcher</Button2>;

export default connector(component);