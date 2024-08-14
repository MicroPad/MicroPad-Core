import './NotepadDropdownComponent.css';
import React from 'react';
import { Dropdown, Icon } from 'react-materialize';
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
import NavItem2 from '../../NavItem';

export type NotepadDropdownProps = {
	position: NavPos
}

type Props = ConnectedProps<typeof notepadDropdownConnector> & NotepadDropdownProps;

const NotepadDropdownComponent = React.memo((props: Props) => {
	const { notepadTitles, syncState, downloadNotepad } = props;

	const openNotepad = (event) => {
		const title = event.currentTarget.textContent;
		props.openNotepadFromStorage(title);
	};

	const createNotepad = async event => {
		const title = await Dialog.prompt('Notebook/Notepad Title:');
		if (!title) return;

		let notepad = new FlatNotepad(title);
		const section = FlatNotepad.makeFlatSection('Unorganised Notes');
		const note = new Note('Untitled Note').clone({ parent: section.internalRef });
		notepad = notepad.addSection(section).addNote(note);

		if (title) props.newNotepad!(notepad);
	}

	const notepadNavItems: JSX.Element[] = [];
	notepadTitles?.forEach(title => notepadNavItems.push(<NavItem2 key={generateGuid()} href="#!" onClick={openNotepad}>{title}</NavItem2>));

	return (
		<Dropdown className="header__notepad-dropdown" trigger={
			<ul id="notepad-dropdown">
				<NavItem2 className="header__top-level-item">
					<Icon left={true}>collections_bookmark</Icon> Notebooks <Icon right={true}>arrow_drop_down</Icon>
				</NavItem2>
			</ul>
		}>
			<NavItem2 href="#!" onClick={createNotepad}><Icon left={true}>add</Icon> New</NavItem2>
			<UploadNotepadsComponent />
			<ImportMarkdownComponent />
			<ExportAllComponent />

			<LoginComponent
				trigger={<NavItem2 href="#!"><Icon left={true}>cloud_download</Icon> Connect to {SYNC_NAME}</NavItem2>}
				manageTrigger={<ManageSyncComponent />}
			/>

			{/* User's notepads from here */}
			<li className="divider" />
			{notepadNavItems}

			<li className="divider" />
			{!syncState.sharedNotepadList && syncState.isLoading && <NavItem2 href="#!">Loading...</NavItem2>}
			{!!syncState.sharedNotepadList && Object.keys(syncState.sharedNotepadList).map(title =>
				<NavItem2 key={generateGuid()} href="#!" onClick={() => {
					downloadNotepad!(syncState.sharedNotepadList![title].notepad);
				}}>
					{title} ({SYNC_NAME} - {syncState.sharedNotepadList![title].owner})
				</NavItem2>
			)}
		</Dropdown>
	);
});
NotepadDropdownComponent.displayName = 'NotepadDropdownComponent';

export default NotepadDropdownComponent;
