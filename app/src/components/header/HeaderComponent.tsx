import * as React from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';
import { INotepadStoreState } from '../../types/NotepadTypes';
import NotepadBreadcrumbs from '../../containers/header/NotepadBreadcrumbsContainer';
import SearchComponent from '../../containers/SearchContainer';

export interface IHeaderComponentProps {
	isFullScreen: boolean;
	isSyncing: boolean;
	getHelp?: () => void;
	notepad?: INotepadStoreState;
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
		const { getHelp, notepad, isFullScreen, isSyncing, flipFullScreenState } = this.props;

		let saveText: string = (!!notepad && !!notepad.item)
			? (notepad.saving)
				? 'Saving...'
				: 'All changes saved'
			: '';

		if (isSyncing) saveText = 'Syncing...';

		return (
			<header style={{position: 'fixed', zIndex: 1000}}>
				<Navbar className="blue-grey menu-items" brand={<AppNameComponent />} href="#!" style={this.navStyle} right={true}>
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
