import { connect } from 'react-redux';
import { actions } from '../../../actions';
import AppSettingsComponent from './AppSettingsComponent';

export const appSettingsContainer = connect(() => ({}), dispatch => ({
	clearOldData: () => dispatch(actions.clearOldData.started())
}));

export default appSettingsContainer(AppSettingsComponent);
