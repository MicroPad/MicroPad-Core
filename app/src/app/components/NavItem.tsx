import React from 'react';
import { NavItem, NavItemProps } from 'react-materialize';
import { isIOS } from '../services/BrowserDetection';

const IS_IOS = isIOS();

const NavItem2 = (props: NavItemProps) => {
	// @ts-expect-error Adding an extra property that's not on the type (onTouchEnd). The real JS uses it.
	return <NavItem {...props} onClick={IS_IOS ? undefined : props.onClick} onTouchEnd={IS_IOS ? props.onClick : undefined} />;
}

export default NavItem2;
