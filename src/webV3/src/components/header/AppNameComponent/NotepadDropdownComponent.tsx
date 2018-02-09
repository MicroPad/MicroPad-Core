import * as React from 'react';
import { SYNC_NAME } from '../../../types';
// @ts-ignore
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';

export default class NotepadDropdownComponent extends React.Component {
	render() {
		return (
		<li>
			<Dropdown trigger={
				<ul>
					<NavItem>
						<Icon left={true}>collections_bookmark</Icon> Notepads <Icon right={true}>arrow_drop_down</Icon>
					</NavItem>
				</ul>
			}>
				<NavItem><Icon left={true}>add</Icon> New</NavItem>
				<NavItem><Icon left={true}>cloud_download</Icon> Open ({SYNC_NAME})</NavItem>
				<NavItem><Icon left={true}>file_upload</Icon> Upload</NavItem>
				<NavItem><Icon left={true}>file_download</Icon> Export All</NavItem>
			</Dropdown>
		</li>
	);
	}
}
