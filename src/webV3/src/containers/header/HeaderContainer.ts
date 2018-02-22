import { Action } from 'redux';
import { connect, Dispatch } from 'react-redux';
import { actions } from '../../actions';
import HeaderComponent, { IHeaderComponentProps } from '../../components/header/HeaderComponent';
import { IStoreState } from '../../types';

export function mapStateToProps({ notepads }: IStoreState) {
	return {
		notepad: notepads.notepad
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		getHelp: () => dispatch(actions.getHelp.started(undefined))
	};
}

export default connect<IHeaderComponentProps>(mapStateToProps, mapDispatchToProps)(HeaderComponent);
