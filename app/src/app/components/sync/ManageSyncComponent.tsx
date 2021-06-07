import * as React from 'react';
import { Modal, NavItem } from 'react-materialize';
import { MICROPAD_URL, SYNC_NAME } from '../../types';
import { ISyncState } from '../../reducers/SyncReducer';
import { DEFAULT_MODAL_OPTIONS } from '../../util';

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
				modalOptions={DEFAULT_MODAL_OPTIONS}>
				<ul>
					<li><a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync/manage`}><h5>Account Options</h5></a></li>
					<li><a href="#!" onClick={() => {
						logout();
						this.closeModal();
					}}><h5>Logout</h5></a></li>
				</ul>
			</Modal>
		);
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
