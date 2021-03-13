import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { actions } from '../../actions';
import HeaderComponent from '../../components/header/HeaderComponent';
import { IStoreState } from '../../types';
import { ThemeValues } from '../../ThemeValues';

export function mapStateToProps({ notepads, app, sync }: IStoreState) {
	return {
		notepad: notepads.notepad,
		isSyncing: sync.isLoading,
		isFullScreen: app.isFullScreen,
		theme: ThemeValues[app.theme]
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		getHelp: () => dispatch(actions.getHelp.started()),
		flipFullScreenState: () => dispatch(actions.flipFullScreenState()),
		closeNotepad: () => dispatch(actions.closeNotepad())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderComponent);
