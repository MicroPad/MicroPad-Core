import { Action } from 'redux';
import { connect, Dispatch } from 'react-redux';
import { actions } from '../../actions';
import HeaderComponent, { IHeaderComponentProps } from '../../components/header/HeaderComponent';
import { IStoreState } from '../../types';

export function mapStateToProps({ notepads, meta, sync }: IStoreState) {
	return {
		notepad: notepads.notepad,
		isSyncing: sync.isLoading,
		isFullScreen: meta.isFullScreen
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		getHelp: () => dispatch(actions.getHelp(undefined)),
		flipFullScreenState: () => dispatch(actions.flipFullScreenState(undefined))
	};
}

export default connect<IHeaderComponentProps>(mapStateToProps, mapDispatchToProps)(HeaderComponent);
