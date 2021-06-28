import './HeaderComponent.css';
import * as React from 'react';
import { CSSProperties } from 'react';
import AppNameComponent from '../../containers/header/AppNameContainer';
import { Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from '../../containers/header/NotepadDropdownContainer';
import { INotepadStoreState } from '../../types/NotepadTypes';
import NotepadBreadcrumbs from '../../containers/header/NotepadBreadcrumbsContainer';
import SearchComponent from '../../containers/SearchContainer';
import ThemeDropdownComponent from '../../containers/header/ThemeDropdownContainer';
import { ITheme } from '../../types/Themes';

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
			height: '52px',
			lineHeight: '52px',
			boxShadow: 'none',
			backgroundColor: this.props.theme.chrome,
			transition: 'background-color .3s'
		};

		let saveText: string = !!notepad?.item
			? notepad.saving
				? 'Saving...'
				: 'All changes saved'
			: '';

		if (isSyncing) saveText = 'Syncing...';

		return (
			<header style={{ position: 'fixed', color: theme.explorerContent, zIndex: 1000 }}>
				<Navbar className="menu-items" brand={<AppNameComponent />} style={navStyle} alignLinks="right" menuIcon={<Icon>menu</Icon>}>
					<span style={{ marginRight: '10px', color: theme.explorerContent }}>{saveText}</span>
					<ThemeDropdownComponent />
					<NotepadDropdownComponent />
					<SearchComponent />
					<NavItem href="#!" className="header__top-level-item" onClick={() => setTimeout(getHelp!, 0)}><Icon left={true}>help_outline</Icon> Help</NavItem>
					{isFullScreen && <NavItem href="#!" className="header__top-level-item" onClick={flipFullScreenState}><Icon left={true}>fullscreen_exit</Icon> Exit Full Screen</NavItem>}
				</Navbar>
				{!isFullScreen && <NotepadBreadcrumbs />}
			</header>
		);
	}
}
