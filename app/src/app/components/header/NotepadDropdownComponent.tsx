import './NotepadDropdownComponent.css';
import * as React from 'react';
import { Col, Dropdown, Icon, Modal, NavItem, ProgressBar, Row } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';
import { DEFAULT_MODAL_OPTIONS, generateGuid } from '../../util';
import { Dialog } from '../../services/dialogs';
import { SYNC_NAME } from '../../types';
import LoginComponent from '../../containers/LoginContainer';
import ManageSyncComponent from '../../containers/ManageSyncContainer';
import { FlatNotepad, Note } from 'upad-parse/dist';
import ImportMarkdownComponent from '../../containers/header/ImportMarkdownContainer';
import { ISyncState } from '../../reducers/SyncReducer';
import NpxIcon from '../../assets/npx.png';
import MarkdownIcon from '../../assets/md.svg';
import { ITheme } from '../../types/Themes';

export interface INotepadDropdownProps {
	isExporting: boolean;
	notepadTitles?: string[];
	syncState: ISyncState;
	theme: ITheme;
	openNotepadFromStorage?: (title: string) => void;
	newNotepad?: (notepad: FlatNotepad) => void;
	exportAll?: () => void;
	exportToMarkdown?: () => void;
	downloadNotepad?: (syncId: string) => void;
}

export default class NotepadDropdownComponent extends React.Component<INotepadDropdownProps> {
	render() {
		const { notepadTitles, syncState, exportAll, exportToMarkdown, downloadNotepad, theme } = this.props;

		const notepadNavItems: JSX.Element[] = [];
		notepadTitles?.forEach(title => notepadNavItems.push(<NavItem key={generateGuid()} href="#!" onClick={this.openNotepad}>{title}</NavItem>));


		const iconStyles = {
			width: '6rem',
			height: 'auto',
			marginLeft: 'calc(50% - 3rem)'
		};

		return (
			<Dropdown id="header__notepad-dropdown" trigger={
				<ul id="notepad-dropdown">
					<NavItem className="header__top-level-item">
						<Icon left={true}>collections_bookmark</Icon> Notebooks <Icon right={true}>arrow_drop_down</Icon>
					</NavItem>
				</ul>
			}>
				<NavItem href="#!" onClick={this.createNotepad}><Icon left={true}>add</Icon> New</NavItem>
				<UploadNotepadsComponent />
				<ImportMarkdownComponent />

				<Modal
					id="export-all-notepads-modal"
					key="export-all-notepads-modal"
					header="Export All Notepads"
					trigger={<NavItem href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>}
					options={DEFAULT_MODAL_OPTIONS}>
					<Row>
						<Col s={12} m={6} style={{ cursor: 'pointer' }}>
							<a href="#!" onClick={e => {
								e.preventDefault();
								exportAll?.();
								return false;
							}}>
								<img src={NpxIcon} style={iconStyles} title="Export notepads as a zip archive of NPX files" alt="" />
								<p style={{ textAlign: 'center' }}>Export notepads as a zip archive of NPX files</p>
							</a>
						</Col>
						<Col s={12} m={6} style={{ cursor: 'pointer' }}>
							<a href="#!" onClick={e => {
								e.preventDefault();
								exportToMarkdown?.();
								return false;
							}}>
								<img src={MarkdownIcon} className="export-all__md-icon" style={{
									...iconStyles,
									filter: theme.text !== '#000' ? 'invert(100%)' : undefined
								}} title="Export notepads as a zip archive of markdown files" alt="" />
								<p style={{ textAlign: 'center' }}>Export notepads as a zip archive of markdown files</p>
							</a>
						</Col>
						{this.props.isExporting && <ProgressBar className="amber" />}
					</Row>
				</Modal>

				<LoginComponent
					trigger={<NavItem href="#!"><Icon left={true}>cloud_download</Icon> Connect to {SYNC_NAME}</NavItem>}
					manageTrigger={<ManageSyncComponent />}
				/>

				{/* User's notepads from here */}
				<li className="divider" />
				{notepadNavItems}

				<li className="divider" />
				{!syncState.sharedNotepadList && syncState.isLoading && <NavItem href="#!">Loading...</NavItem>}
				{!!syncState.sharedNotepadList && Object.keys(syncState.sharedNotepadList).map(title =>
					<NavItem key={generateGuid()} href="#!" onClick={() => {
						downloadNotepad!(syncState.sharedNotepadList![title].notepad);
					}}>
						{title} ({SYNC_NAME} - {syncState.sharedNotepadList![title].owner})
					</NavItem>
				)}
			</Dropdown>
		);
	}

	private openNotepad = (event) => {
		const { openNotepadFromStorage } = this.props;
		let title = event.currentTarget.textContent;

		openNotepadFromStorage!(title);
	}

	private createNotepad = async () => {
		const title = await Dialog.prompt('Notebook/Notepad Title:');
		if (!title) return;

		let notepad = new FlatNotepad(title);
		let section = FlatNotepad.makeFlatSection('Unorganised Notes');
		let note = new Note('Untitled Note').clone({ parent: section.internalRef });
		notepad = notepad.addSection(section).addNote(note);

		if (title) this.props.newNotepad!(notepad);
	}
}
