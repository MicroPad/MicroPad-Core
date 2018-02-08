import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
// @ts-ignore
import { Icon, Navbar, NavItem, Dropdown } from 'react-materialize';
import { SYNC_NAME } from '../../types';

export default class HeaderComponent extends React.Component {
	private readonly navStyle = {
		position: 'fixed'
	};

	render() {
		return (
			<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} right={true}>
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

				<NavItem><Icon left={true}>search</Icon> Search</NavItem>
				<NavItem><Icon left={true}>help_outline</Icon> Help</NavItem>
			</Navbar>
		);
	}
}
