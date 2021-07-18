import React from 'react';
import { MICROPAD_URL, SYNC_NAME } from '../../types';
import { ISyncedNotepad, SyncUser } from '../../types/SyncTypes';
import * as DifferenceEngine from '../../services/DifferenceEngine';
import { Dialog } from '../../services/dialogs';
import LoginComponent from '../../containers/LoginContainer';
import { FlatNotepad } from 'upad-parse/dist';
import { ISyncState } from '../../reducers/SyncReducer';

export interface ISyncOptionsComponentProps {
	syncState: ISyncState;
	syncId?: string;
	notepad?: FlatNotepad;
	sync?: (syncId: string, notepad: ISyncedNotepad) => void;
	deleteNotepad?: (syncId: string) => void;
	addNotepad?: (user: SyncUser, title: string) => void;
}

export default class SyncOptionsComponent extends React.Component<ISyncOptionsComponentProps> {
	render() {
		const { syncState, syncId, notepad, addNotepad } = this.props;
		if (!notepad || (!syncState.sharedNotepadList && syncState.user)) return null;

		if (!syncState.user) {
			return (
				<LoginComponent trigger={
					<strong><a href="#!" style={{
						textDecoration: 'underline',
						whiteSpace: 'normal'
					}}>Connect to {SYNC_NAME} to have this notebook on all of your devices</a></strong>
				} />
			);
		}

		return (
			<React.Fragment>
				<strong>{SYNC_NAME} Options for <em>{notepad.title}</em></strong>
				{!syncId && <span><a href="#!" onClick={() => addNotepad!(syncState.user!, notepad.title)} style={{ textDecoration: 'underline' }}><br /> Start syncing this notepad</a></span>}

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
										<a
											href="#!"
											style={{ textDecorationColor: '#F44336' }}
											onClick={() => setTimeout(() => this.stopSyncing(), 0)}>
											Stop syncing this notepad
										</a>
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
		if (!syncId || !notepad || !sync) return;

		const syncedNotepad = await DifferenceEngine.SyncService.notepadToSyncedNotepad(notepad.toNotepad());
		sync(syncId, syncedNotepad);
	}

	private stopSyncing = async () => {
		const { syncId, notepad, deleteNotepad } = this.props;
		if (!syncId || !notepad || !deleteNotepad) return;

		if (!await Dialog.confirm(`Are you sure you want to remove ${notepad.title} from ${SYNC_NAME}?`)) return;
		deleteNotepad(syncId);
	}
}
