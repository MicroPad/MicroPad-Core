import React from 'react';
import { MICROPAD_URL, SYNC_NAME } from '../../../types';
import * as DifferenceEngine from '../../../services/DifferenceEngine';
import { Dialog } from '../../../services/dialogs';
import LoginComponent from '../../../containers/LoginContainer';
import { syncOptionsConnector } from './SyncOptionsContainer';
import { ConnectedProps } from 'react-redux';
import Button2 from '../../Button';

export default class SyncOptionsComponent extends React.Component<ConnectedProps<typeof syncOptionsConnector>> {
	render() {
		const { syncState, syncId, notepad, addNotepad } = this.props;
		if (!notepad || (!syncState.sharedNotepadList && syncState.user)) return null;

		if (!syncState.user) {
			return (
				<LoginComponent trigger={
					<Button2 className="accent-btn" waves="light" style={{
						paddingLeft: '16px',
						paddingRight: '16px',
						height: 'auto'
					}}>
						Connect to <span style={{ textTransform: 'initial'}}>{SYNC_NAME}</span>
					</Button2>
				} />
			);
		}

		return (
			<React.Fragment>
				<strong>{SYNC_NAME} Options for <em>{notepad.title}</em></strong>
				{!syncId && <span><Button2 className="accent-btn" waves="light" style={{
					paddingLeft: '16px',
					paddingRight: '16px',
					height: 'auto'
				}} disabled={syncState.isLoading} onClick={() => addNotepad(syncState.user, notepad.title)}>
					Start syncing this notepad
				</Button2></span>}

				{
					!!syncId &&
					<div>
						{syncState.isLoading && <span>Syncing...</span>}
						{
							!syncState.isLoading &&
							<div>
								<ul className="sync-settings-component__action-list">
									<li>
										Synced! (<a href="#!" style={{ textDecoration: 'underline' }} onClick={this.manualSync}>Refresh</a>)
									</li>

									<li>
										<Button2
											className="danger"
											flat
											waves="light"
											style={{
												paddingLeft: '16px',
												paddingRight: '16px',
												height: 'auto'
											}}
											onClick={() => setTimeout(() => this.stopSyncing(), 0)}>
											Stop syncing this notepad
										</Button2>
									</li>

									<li style={{ paddingTop: '1em' }}>
										<a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync/manage`}>Collaboration/Sharing Options</a>
										<ul className="sync-settings-component__action-list">
											{!!syncState.sharedNotepadList![notepad.title] && <li>Scribe: <em>{syncState.sharedNotepadList![notepad.title].scribe}</em></li>}
										</ul>
									</li>
								</ul>
							</div>
						}
					</div>
				}
			</React.Fragment>
		);
	}

	private manualSync = async () => {
		const { syncId, notepad, sync } = this.props;
		if (!syncId || !notepad) return;

		const syncedNotepad = await DifferenceEngine.SyncService.notepadToSyncedNotepad(notepad.toNotepad());
		sync(syncId, syncedNotepad);
	}

	private stopSyncing = async () => {
		const { syncId, notepad, deleteNotepad } = this.props;
		if (!syncId || !notepad) return;

		if (!await Dialog.confirm(`Are you sure you want to remove ${notepad.title} from ${SYNC_NAME}?`)) return;
		deleteNotepad(syncId);
	}
}
