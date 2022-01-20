import './NotepadDropdownComponent.css';
import React from 'react';
import { Dropdown, Icon, NavItem } from 'react-materialize';
import UploadNotepadsComponent from '../upload-notepads/UploadNotepadsContainer';
import { generateGuid } from '../../../util';
import { Dialog } from '../../../services/dialogs';
import { SYNC_NAME } from '../../../types';
import LoginComponent from '../../../containers/LoginContainer';
import ManageSyncComponent from '../../../containers/ManageSyncContainer';
import { FlatNotepad, Note } from 'upad-parse/dist';
import ImportMarkdownComponent from '../import-markdown/ImportMarkdownContainer';
import { ConnectedProps } from 'react-redux';
import { notepadDropdownConnector } from './NotepadDropdownContainer';
import { NavPos } from '../HeaderContainer';
import ExportAllComponent from '../export-all/ExportAllContainer';

export type NotepadDropdownProps = {
	position: NavPos
}

type Props = ConnectedProps<typeof notepadDropdownConnector> & NotepadDropdownProps;

const NotepadDropdownComponent = React.memo((props: Props) => {
	const { notepadTitles, syncState, downloadNotepad } = props;

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
			<ExportAllComponent />

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
