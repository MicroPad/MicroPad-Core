import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
// @ts-ignore
import { Icon, Navbar, NavItem } from 'react-materialize';

export default class HeaderComponent extends React.Component {
	private readonly navStyle = {
		position: 'fixed'
	};

	render() {
		return (
			<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} />
		);
	}
}
