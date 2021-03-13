import * as React from 'react';
import { Col, Dropdown, Icon, Modal, NavItem, ProgressBar, Row } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';
import { generateGuid } from '../../util';
import { Dialog } from '../../services/dialogs';
import { SYNC_NAME } from '../../types';
import LoginComponent from '../../containers/LoginContainer';
import ManageSyncComponent from '../../containers/ManageSyncContainer';
import { FlatNotepad, Note } from 'upad-parse/dist';
import ImportMarkdownComponent from '../../containers/header/ImportMarkdownContainer';
import { ISyncState } from '../../reducers/SyncReducer';
import NpxIcon from '../../assets/npx.png';
import MarkdownIcon from '../../assets/md.svg';

export interface INotepadDropdownProps {
	isExporting: boolean;
	notepadTitles?: string[];
	syncState: ISyncState;
	openNotepadFromStorage?: (title: string) => void;
	newNotepad?: (notepad: FlatNotepad) => void;
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
							<Icon left={true}>collections_bookmark</Icon> Notebooks <Icon right={true}>arrow_drop_down</Icon>
						</NavItem>
					</ul>
				}>
					<NavItem href="#!" onClick={this.createNotepad}><Icon left={true}>add</Icon> New</NavItem>
					<UploadNotepadsComponent />
					<ImportMarkdownComponent />

					<Modal
						header="Export All Notepads"
						trigger={<NavItem id="export-all-notepads-trigger" href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>}>
						<Row>
							<Col s={12} m={6} style={{cursor: 'pointer'}} onClick={exportAll}>
								<img src={NpxIcon} style={iconStyles} title="Export notepads as a zip archive of NPX files" alt="" />
								<p style={{textAlign: 'center'}}>Export notepads as a zip archive of NPX files</p>
							</Col>
							<Col s={12} m={6} style={{cursor: 'pointer'}} onClick={exportToMarkdown}>
								<img src={MarkdownIcon} style={iconStyles} title="Export notepads as a zip archive of markdown files" alt="" />
								<p style={{textAlign: 'center'}}>Export notepads as a zip archive of markdown files</p>
							</Col>
							{this.props.isExporting && <ProgressBar className="amber" />}
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
					{!!syncState.sharedNotepadList &&  Object.keys(syncState.sharedNotepadList).map(title =>
						<NavItem key={generateGuid()} href="#!" onClick={() => {
							downloadNotepad!(syncState.sharedNotepadList![title].notepad);
						}}>
							{title} ({SYNC_NAME} - {syncState.sharedNotepadList![title].owner})
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
		const title = await Dialog.prompt('Notebook/Notepad Title:');

		let notepad = new FlatNotepad(title);
		let section = FlatNotepad.makeFlatSection('Unorganised Notes');
		let note = new Note('Untitled Note').clone({ parent: section.internalRef });
		notepad = notepad.addSection(section).addNote(note);

		if (title) this.props.newNotepad!(notepad);
	}
}
