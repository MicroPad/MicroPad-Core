import { IStoreState } from '../../../types';
import { connect } from 'react-redux';
import AppNameComponent from './AppNameComponent';
import { actions } from '../../../actions';
import { ThemeValues } from '../../../ThemeValues';

export const appNameConnector = connect(
	(state: IStoreState) => ({ version: state.app.version, theme: ThemeValues[state.app.theme] }),
	dispatch => ({
		closeNotepad: () => dispatch(actions.closeNotepad())
	})
)

export default appNameConnector(AppNameComponent);
