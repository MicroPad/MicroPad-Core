import { connect } from 'react-redux';
import { actions } from '../../actions';
import HeaderComponent from './HeaderComponent';
import { IStoreState } from '../../types';
import { ThemeValues } from '../../ThemeValues';

export const enum NavPos {
	MainNav,
	SideNav
}

export const headerConnector = connect(
	(state: IStoreState) => ({
		notepad: state.notepads.notepad,
		isSyncing: state.sync.isLoading,
		isFullScreen: state.app.isFullScreen,
		theme: ThemeValues[state.app.theme]
	}),
	dispatch => ({
		getHelp: () => dispatch(actions.getHelp.started()),
		flipFullScreenState: () => dispatch(actions.flipFullScreenState()),
		closeNotepad: () => dispatch(actions.closeNotepad())
	})
);

export default headerConnector(HeaderComponent);
