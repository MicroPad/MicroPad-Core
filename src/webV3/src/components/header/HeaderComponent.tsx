import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
// @ts-ignore
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from './NotepadDropdownComponent';

export default class HeaderComponent extends React.Component {
	private readonly navStyle = {
		position: 'fixed'
	};

	render() {
		return (
			<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} right={true}>
				<NotepadDropdownComponent />
				<NavItem><Icon left={true}>search</Icon> Search</NavItem>
				<NavItem><Icon left={true}>help_outline</Icon> Help</NavItem>
			</Navbar>
		);
	}
}
