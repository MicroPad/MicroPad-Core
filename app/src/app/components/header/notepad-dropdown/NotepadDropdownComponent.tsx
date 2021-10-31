import './NotepadDropdownComponent.css';
import React from 'react';
import { Col, Dropdown, Icon, NavItem, ProgressBar, Row } from 'react-materialize';
import UploadNotepadsComponent from '../upload-notepads/UploadNotepadsContainer';
import { DEFAULT_MODAL_OPTIONS, generateGuid } from '../../../util';
import { Dialog } from '../../../services/dialogs';
import { SYNC_NAME } from '../../../types';
import LoginComponent from '../../../containers/LoginContainer';
import ManageSyncComponent from '../../../containers/ManageSyncContainer';
import { FlatNotepad, Note } from 'upad-parse/dist';
import ImportMarkdownComponent from '../import-markdown/ImportMarkdownContainer';
import NpxIcon from '../../../assets/npx.png';
import MarkdownIcon from '../../../assets/md.svg';
import { ConnectedProps } from 'react-redux';
import { notepadDropdownConnector } from './NotepadDropdownContainer';
import { NavPos } from '../HeaderContainer';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';

export type NotepadDropdownProps = {
	position: NavPos
}

type Props = ConnectedProps<typeof notepadDropdownConnector> & NotepadDropdownProps;

const NotepadDropdownComponent = React.memo((props: Props) => {
	const { notepadTitles, syncState, exportAll, exportToMarkdown, downloadNotepad, theme } = props;

	const openNotepad = (event) => {
		let title = event.currentTarget.textContent;
		props.openNotepadFromStorage(title);
	};

	const createNotepad = async event => {
		const title = await Dialog.prompt('Notebook/Notepad Title:');
		if (!title) return;

		let notepad = new FlatNotepad(title);
		let section = FlatNotepad.makeFlatSection('Unorganised Notes');
		let note = new Note('Untitled Note').clone({ parent: section.internalRef });
		notepad = notepad.addSection(section).addNote(note);

		if (title) props.newNotepad!(notepad);
	}

	const notepadNavItems: JSX.Element[] = [];
	notepadTitles?.forEach(title => notepadNavItems.push(<NavItem key={generateGuid()} href="#!" onClick={openNotepad}>{title}</NavItem>));


	const iconStyles = {
		width: '6rem',
		height: 'auto',
		marginLeft: 'calc(50% - 3rem)'
	};

	return (
		<Dropdown className="header__notepad-dropdown" trigger={
			<ul id="notepad-dropdown">
				<NavItem className="header__top-level-item">
					<Icon left={true}>collections_bookmark</Icon> Notebooks <Icon right={true}>arrow_drop_down</Icon>
				</NavItem>
			</ul>
		}>
			<NavItem href="#!" onClick={createNotepad}><Icon left={true}>add</Icon> New</NavItem>
			<UploadNotepadsComponent />
			<ImportMarkdownComponent />

			<SingletonModalComponent
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
					{props.isExporting && <ProgressBar className="amber" />}
				</Row>
			</SingletonModalComponent>

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
});

export default NotepadDropdownComponent;
