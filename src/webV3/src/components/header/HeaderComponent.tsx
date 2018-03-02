import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
// @ts-ignore
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';
import { INotepadStoreState } from '../../types/NotepadTypes';
import NotepadBreadcrumbs from '../../containers/header/NotepadBreadcrumbsContainer';

export interface IHeaderComponentProps {
	getHelp?: () => void;
	notepad?: INotepadStoreState;
}

export default class HeaderComponent extends React.Component<IHeaderComponentProps> {
	private readonly navStyle = {
		position: 'fixed',
		height: '64px',
		lineHeight: '64px',
		boxShadow: 'none'
	};

	render() {
		const { getHelp, notepad } = this.props;

		const saveText: string = (!!notepad && !!notepad.item)
			? (notepad.saving)
				? 'Saving...'
				: 'All changes saved'
			: '';

		return (
			<header style={{position: 'fixed'}}>
				<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} right={true}>
					<li style={{ marginRight: '10px' }}>{saveText}</li>
					<NotepadDropdownComponent />
					{!!notepad && !!notepad.item && <NavItem href="#!"><Icon left={true}>search</Icon> Search</NavItem>}
					<NavItem href="#!" onClick={getHelp}><Icon left={true}>help_outline</Icon> Help</NavItem>
				</Navbar>
				<NotepadBreadcrumbs />
			</header>
		);
	}
}
