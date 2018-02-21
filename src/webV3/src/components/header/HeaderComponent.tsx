import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
// @ts-ignore
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';

export interface IHeaderComponentProps {
	getHelp?: () => void;
}

export default class HeaderComponent extends React.Component<IHeaderComponentProps> {
	private readonly navStyle = {
		position: 'fixed'
	};

	render() {
		const { getHelp } = this.props;

		return (
			<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} right={true}>
				<NotepadDropdownComponent />
				<NavItem><Icon left={true}>search</Icon> Search</NavItem>
				<NavItem href="#!" onClick={getHelp}><Icon left={true}>help_outline</Icon> Help</NavItem>
			</Navbar>
		);
	}
}
