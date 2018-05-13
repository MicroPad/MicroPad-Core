import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';
import { INotepadStoreState } from '../../types/NotepadTypes';
import NotepadBreadcrumbs from '../../containers/header/NotepadBreadcrumbsContainer';
import SearchComponent from '../../containers/SearchContainer';

export interface IHeaderComponentProps {
	getHelp?: () => void;
	notepad?: INotepadStoreState;
	isFullScreen: boolean;
	flipFullScreenState?: () => void;
}

export default class HeaderComponent extends React.Component<IHeaderComponentProps> {
	private readonly navStyle = {
		position: 'fixed',
		height: '64px',
		lineHeight: '64px',
		boxShadow: 'none'
	};

	render() {
		const { getHelp, notepad, isFullScreen, flipFullScreenState } = this.props;

		const saveText: string = (!!notepad && !!notepad.item)
			? (notepad.saving)
				? 'Saving...'
				: 'All changes saved'
			: '';

		return (
			<header style={{position: 'fixed', zIndex: 1000}}>
				<Navbar className="blue-grey" brand={<AppNameComponent />} style={this.navStyle} right={true}>
					<li style={{ marginRight: '10px' }}>{saveText}</li>
					<NotepadDropdownComponent />
					{!!notepad && !!notepad.item && <SearchComponent />}
					<NavItem href="#!" onClick={getHelp}><Icon left={true}>help_outline</Icon> Help</NavItem>
					{isFullScreen && <NavItem href="#!" onClick={flipFullScreenState}><Icon left={true}>fullscreen_exit</Icon> Exit Full Screen</NavItem>}
				</Navbar>
				<NotepadBreadcrumbs />
			</header>
		);
	}
}
