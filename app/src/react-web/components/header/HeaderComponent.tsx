import * as React from 'react';
import { CSSProperties } from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
import { Dropdown, Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';
import { INotepadStoreState } from '../../../core/types/NotepadTypes';
import NotepadBreadcrumbs from '../../containers/header/NotepadBreadcrumbsContainer';
import SearchComponent from '../../containers/SearchContainer';
import ThemeDropdownComponent from '../../containers/header/ThemeDropdownContainer';
import { ITheme } from '../../../core/types/Themes';

export interface IHeaderComponentProps {
	isFullScreen: boolean;
	isSyncing: boolean;
	theme: ITheme;
	getHelp?: () => void;
	notepad?: INotepadStoreState;
	flipFullScreenState?: () => void;
	closeNotepad?: () => void;
}

export default class HeaderComponent extends React.Component<IHeaderComponentProps> {
	render() {
		const { getHelp, notepad, isFullScreen, isSyncing, theme, flipFullScreenState } = this.props;

		const navStyle: CSSProperties = {
			position: 'fixed',
			height: '64px',
			lineHeight: '64px',
			boxShadow: 'none',
			backgroundColor: this.props.theme.chrome,
			transition: 'background-color .3s'
		};

		let saveText: string = (!!notepad && !!notepad.item)
			? (notepad.saving)
				? 'Saving...'
				: 'All changes saved'
			: '';

		if (isSyncing) saveText = 'Syncing...';

		return (
			<header style={{position: 'fixed', zIndex: 1000}}>
				<Navbar className="menu-items" brand={<AppNameComponent />} href="#!" style={navStyle} right={true}>
					<li style={{ marginRight: '10px', color: theme.explorerContent }}>{saveText}</li>
					<ThemeDropdownComponent />
					<NotepadDropdownComponent />
					<SearchComponent />
					<NavItem href="#!" onClick={getHelp}><Icon left={true}>help_outline</Icon> Help</NavItem>
					{isFullScreen && <NavItem href="#!" onClick={flipFullScreenState}><Icon left={true}>fullscreen_exit</Icon> Exit Full Screen</NavItem>}
				</Navbar>
				{!isFullScreen && <NotepadBreadcrumbs />}
			</header>
		);
	}
}
