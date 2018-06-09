import * as React from 'react';
import { Col, Dropdown, Icon, Modal, NavItem, Row } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';
import * as Parser from 'upad-parse/dist/index.js';
import { INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';
import { Dialog } from '../../dialogs';
import { SYNC_NAME } from '../../types';
import LoginComponent from '../../containers/LoginContainer';
import { ISyncState } from '../../reducers/SyncReducer';
import ManageSyncComponent from '../../containers/ManageSyncContainer';

const NPX_ICON = require('../../assets/npx.png');
const MD_ICON = require('../../assets/md.svg');

export interface INotepadDropdownProps {
	notepadTitles?: string[];
	syncState: ISyncState;
	openNotepadFromStorage?: (title: string) => void;
	newNotepad?: (notepad: INotepad) => void;
	exportAll?: () => void;
	exportToMarkdown?: () => void;
	downloadNotepad?: (syncId: string) => void;
}

export default class NotepadDropdownComponent extends React.Component<INotepadDropdownProps> {
	render() {
		const { notepadTitles, syncState, exportAll, exportToMarkdown, downloadNotepad } = this.props;

		const notepadNavItems: JSX.Element[] = [];
		(notepadTitles || []).forEach((title: string) => notepadNavItems.push(<NavItem key={generateGuid()} href="#!" onClick={this.openNotepad}>{title}</NavItem>));

		const iconStyles = {
			width: '6rem',
			height: 'auto',
			marginLeft: 'calc(50% - 3rem)'
		};

		return (
			<li>
				<Dropdown trigger={
					<ul>
						<NavItem id="notepad-dropdown">
							<Icon left={true}>collections_bookmark</Icon> Notepads <Icon right={true}>arrow_drop_down</Icon>
						</NavItem>
					</ul>
				}>
					<NavItem href="#!" onClick={this.createNotepad}><Icon left={true}>add</Icon> New</NavItem>
					<UploadNotepadsComponent />

					<Modal
						header="Export All Notepads"
						trigger={<NavItem id="export-all-notepads-trigger" href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>}>
						<Row>
							<Col s={12} m={6} style={{cursor: 'pointer'}} onClick={exportAll}>
								<img src={NPX_ICON} style={iconStyles} title="Export notepads as a zip archive of NPX files" />
								<p style={{textAlign: 'center'}}>Export notepads as a zip archive of NPX files</p>
							</Col>
							<Col s={12} m={6} style={{cursor: 'pointer'}} onClick={exportToMarkdown}>
								<img src={MD_ICON} style={iconStyles} title="Export notepads as a zip archive of markdown files" />
								<p style={{textAlign: 'center'}}>Export notepads as a zip archive of markdown files</p>
							</Col>
						</Row>
					</Modal>

					<LoginComponent
						trigger={<NavItem href="#!"><Icon left={true}>cloud_download</Icon> Connect to {SYNC_NAME}</NavItem>}
						manageTrigger={<ManageSyncComponent />}
					/>

					{/* User's notepads from here */}
					<NavItem divider={true} />
					{notepadNavItems}

					<NavItem divider={true} />
					{syncState.isLoading && <NavItem href="#!">Loading...</NavItem>}
					{!!syncState.notepadList &&  Object.keys(syncState.notepadList).map(title =>
						<NavItem key={generateGuid()} href="#!" onClick={() => {
							downloadNotepad!(syncState.notepadList![title]);
						}}>
							{title} ({SYNC_NAME})
						</NavItem>
					)}
				</Dropdown>
			</li>
		);
	}

	private openNotepad = (event) => {
		const { openNotepadFromStorage } = this.props;
		let title = event.currentTarget.textContent;

		openNotepadFromStorage!(title);
	}

	private createNotepad = async () => {
		const title = await Dialog.prompt('Notepad Title:');

		if (title) this.props.newNotepad!(Parser.createNotepad(title));
	}
}
