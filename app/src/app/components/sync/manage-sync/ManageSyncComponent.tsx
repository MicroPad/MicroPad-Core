import React from 'react';
import { NavItem } from 'react-materialize';
import { MICROPAD_URL, SYNC_NAME } from '../../../types';
import { ISyncState } from '../../../reducers/SyncReducer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import Button2 from '../../Button';

export interface IManageSyncComponentProps {
	syncState: ISyncState;
	logout?: () => void;
}

export default class ManageSyncComponent extends React.Component<IManageSyncComponentProps> {
	render() {
		const { syncState, logout } = this.props;
		if (!syncState.user || !logout) return null;

		return (
			<SingletonModalComponent
				id="manage-microsync-modal"
				header={`Manage ${SYNC_NAME}`}
				trigger={<NavItem href="#!">Manage {SYNC_NAME}</NavItem>}
				actions={[
					<Button2 className="modal-close" flat onClick={logout}>Logout</Button2>,
					<Button2 className="modal-close" flat>Close</Button2>
				]}
				options={DEFAULT_MODAL_OPTIONS}>
				<a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync/manage`}><h5>Go to <em>Manage {SYNC_NAME}</em></h5></a>
			</SingletonModalComponent>
		);
	}
}
