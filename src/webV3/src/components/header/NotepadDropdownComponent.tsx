import * as React from 'react';
import { SYNC_NAME } from '../../types';
// @ts-ignore
import { Dropdown, Icon, NavItem } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';
import * as Parser from 'upad-parse/dist/index.js';
import { INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';

export interface INotepadDropdownProps {
	notepadTitles?: string[];
	openNotepadFromStorage?: (title: string) => void;
	newNotepad?: (notepad: INotepad) => void;
}

export default class NotepadDropdownComponent extends React.Component<INotepadDropdownProps> {
	render() {
		const { notepadTitles } = this.props;

		const notepadNavItems: JSX.Element[] = [];
		(notepadTitles || []).forEach((title: string) => notepadNavItems.push(<NavItem key={generateGuid()} href="#!" onClick={this.openNotepad}>{title}</NavItem>));

		return (
			<li>
				<Dropdown trigger={
					<ul>
						<NavItem>
							<Icon left={true}>collections_bookmark</Icon> Notepads <Icon right={true}>arrow_drop_down</Icon>
						</NavItem>
					</ul>
				}>
					<NavItem href="#!" onClick={this.createNotepad}><Icon left={true}>add</Icon> New</NavItem>
					<NavItem href="#!"><Icon left={true}>cloud_download</Icon> Open ({SYNC_NAME})</NavItem>
					<UploadNotepadsComponent />
					<NavItem href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>

					{/* User's notepads from here */}
					<NavItem divider={true} />
					{notepadNavItems}
				</Dropdown>
			</li>
		);
	}

	private openNotepad = (event) => {
		const { openNotepadFromStorage } = this.props;
		let title = event.currentTarget.innerText;
		title = title.substr(0, title.length - 1);

		openNotepadFromStorage!(title);
	}

	private createNotepad = () => {
		const title = prompt('Notepad Title:');

		if (title) this.props.newNotepad!(Parser.createNotepad(title));
	}
}
