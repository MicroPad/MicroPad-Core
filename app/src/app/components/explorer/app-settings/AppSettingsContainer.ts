import { connect } from 'react-redux';
import { actions } from '../../../actions';
import AppSettingsComponent from './AppSettingsComponent';

export const appSettingsContainer = connect(() => ({}), dispatch => ({
	clearOldData: () => dispatch(actions.clearOldData.started({ silent: false })),
	feelingLucky: () => dispatch(actions.feelingLucky())
}));

export default appSettingsContainer(AppSettingsComponent);
