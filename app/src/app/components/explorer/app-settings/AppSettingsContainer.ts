import { connect } from 'react-redux';
import { actions } from '../../../actions';
import AppSettingsComponent from './AppSettingsComponent';
import { IStoreState } from '../../../types';
import { Dialog } from '../../../services/dialogs';

export const appSettingsContainer = connect(
	(state: IStoreState) => ({
		cryptoStatus: state.app.hasEncryptedNotebooks
	}),
	dispatch => ({
		clearOldData: () => dispatch(actions.clearOldData.started({ silent: false })),
		forgetSavedPasswords: async () => {
			if (!await Dialog.confirm('Are you sure that you want MicroPad to forget all saved passwords for encrypted notebooks?')) {
				return;
			}
			dispatch(actions.forgetSavedPasswords.started());
		},
		feelingLucky: () => dispatch(actions.feelingLucky())
	})
);

export default appSettingsContainer(AppSettingsComponent);
