import * as React from 'react';
import { SYNC_NAME } from '../../types';
import { Dropdown, Icon, NavItem, Modal, Row, Col } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';
import * as Parser from 'upad-parse/dist/index.js';
import { INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';

const NPX_ICON = require('../../assets/npx.png');
const MD_ICON = require('../../assets/md.svg');

export interface INotepadDropdownProps {
	notepadTitles?: string[];
	openNotepadFromStorage?: (title: string) => void;
	newNotepad?: (notepad: INotepad) => void;
	exportAll?: () => void;
	exportToMarkdown?: () => void;
}

export default class NotepadDropdownComponent extends React.Component<INotepadDropdownProps> {
	render() {
		const { notepadTitles, exportAll, exportToMarkdown } = this.props;

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
						<NavItem>
							<Icon left={true}>collections_bookmark</Icon> Notepads <Icon right={true}>arrow_drop_down</Icon>
						</NavItem>
					</ul>
				}>
					<NavItem href="#!" onClick={this.createNotepad}><Icon left={true}>add</Icon> New</NavItem>
					<NavItem href="#!"><Icon left={true}>cloud_download</Icon> Open ({SYNC_NAME})</NavItem>
					<UploadNotepadsComponent />

					<Modal
						header="Export All Notepads"
						trigger={<NavItem href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>}>
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

					{/* User's notepads from here */}
					<NavItem divider={true} />
					{notepadNavItems}
				</Dropdown>
			</li>
		);
	}

	private openNotepad = (event) => {
		const { openNotepadFromStorage } = this.props;
		let title = event.currentTarget.textContent;

		openNotepadFromStorage!(title);
	}

	private createNotepad = () => {
		const title = prompt('Notepad Title:');

		if (title) this.props.newNotepad!(Parser.createNotepad(title));
	}
}
