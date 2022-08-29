import { connect } from 'react-redux';
import { actions } from '../../../actions';
import AppSettingsComponent from './AppSettingsComponent';
import { IStoreState } from '../../../types';

export const appSettingsContainer = connect(
	(state: IStoreState) => ({
		hasEncryptedNotebooks: state.app.hasEncryptedNotebooks
	}),
	dispatch => ({
		clearOldData: () => dispatch(actions.clearOldData.started({ silent: false })),
		feelingLucky: () => dispatch(actions.feelingLucky())
	})
);

export default appSettingsContainer(AppSettingsComponent);
