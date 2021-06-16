import * as React from 'react';
import { Button, Modal, NavItem } from 'react-materialize';
import { MICROPAD_URL, SYNC_NAME } from '../../../types';
import { ISyncState } from '../../../reducers/SyncReducer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';

export interface IManageSyncComponentProps {
	syncState: ISyncState;
	logout?: () => void;
}

export default class ManageSyncComponent extends React.Component<IManageSyncComponentProps> {
	render() {
		const { syncState, logout } = this.props;
		if (!syncState.user || !logout) return null;

		return (
			<Modal
				header={`Manage ${SYNC_NAME}`}
				trigger={<NavItem href="#!">Manage {SYNC_NAME}</NavItem>}
				actions={[
					<Button className="modal-close" flat onClick={logout}>Logout</Button>,
					<Button className="modal-close" flat>Close</Button>
				]}
				options={DEFAULT_MODAL_OPTIONS}>
				<a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync/manage`}><h5>Go to <em>Manage {SYNC_NAME}</em></h5></a>
			</Modal>
		);
	}
}
