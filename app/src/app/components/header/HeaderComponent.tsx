import './HeaderComponent.css';
import React, { CSSProperties, useEffect, useState } from 'react';
import AppNameComponent from './app-name/AppNameContainer';
import { Icon, Navbar, NavItem } from 'react-materialize';
import NotepadDropdownComponent from './notepad-dropdown/NotepadDropdownContainer';
import NotepadBreadcrumbs from './notepad-breadcrumbs/NotepadBreadcrumbsContainer';
import SearchComponent from '../search/SearchContainer';
import ThemeDropdownComponent from './theme-dropdown/ThemeDropdownContainer';
import { headerConnector, NavPos } from './HeaderContainer';
import { ConnectedProps } from 'react-redux';

export const HeaderComponent = (props: ConnectedProps<typeof headerConnector>) => {
	/*
	 * This is some fun code to detect if we're in the "mobile" view or not and re-render the component if we are.
	 * Doing it this way instead of with CSS lets us reduce our DOM weight, React rerender trees, and makes sure IDs are
	 * unique!
	 */
	const [isWideScreenView, setIsWideScreenView] = useState<boolean>(true);
	useEffect(() => {
		const observer = new IntersectionObserver(entries =>
			setIsWideScreenView(entries.every(entry => !entry.isIntersecting))
		);
		observer.observe(document.querySelector<HTMLDivElement>('.sidenav-trigger')!);
		return () => observer.disconnect();
	});

	const { getHelp, notepad, isFullScreen, isSyncing, theme, flipFullScreenState } = props;

	const navStyle: CSSProperties = {
		position: 'fixed',
		height: '52px',
		lineHeight: '52px',
		boxShadow: 'none',
		backgroundColor: props.theme.chrome,
		transition: 'background-color .3s'
	};

	let saveText: string = !!notepad?.item
		? notepad.saving
			? 'Saving...'
			: 'All changes saved'
		: '';

	if (isSyncing) saveText = 'Syncing...';

	function generateNavInteractables(position: NavPos): React.ReactNode[] {
		return [
			<span className="Header__save-status" key="status message">{saveText}</span>,
			<ThemeDropdownComponent key="theme" />,
			<NotepadDropdownComponent key="notepads" position={position} />,
			<SearchComponent key="search" />,
			<NavItem key="help" href="#!" className="header__top-level-item" onClick={() => setTimeout(getHelp!, 0)}><Icon left={true}>help_outline</Icon> Help</NavItem>,
			isFullScreen ? <NavItem key="fullscreen" href="#!" className="header__top-level-item" onClick={flipFullScreenState}><Icon left={true}>fullscreen_exit</Icon> Exit Full Screen</NavItem> : null
		];
	}

	const sideNav = (
		<React.Fragment>
			{!isWideScreenView && generateNavInteractables(NavPos.SideNav).map((el, i) => <li key={i}>{el}</li>)}
		</React.Fragment>
	);

	return (
		<header style={{ position: 'fixed', color: theme.explorerContent, zIndex: 1000 }}>
			<Navbar className="menu-items" brand={<AppNameComponent />} style={navStyle} alignLinks="right" menuIcon={<Icon>menu</Icon>} sidenav={sideNav}>
				{isWideScreenView && generateNavInteractables(NavPos.MainNav)}
			</Navbar>
			{!isFullScreen && <NotepadBreadcrumbs />}
		</header>
	);
}

export default HeaderComponent;
