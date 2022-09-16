import React, { useState } from 'react';
import { NavItem, NavItemProps } from 'react-materialize';
import { isIOS } from '../services/BrowserDetection';

const IS_IOS = isIOS();

const NavItem2 = React.memo((props: NavItemProps) => {
	const [isDragging, setIsDragging] = useState(false);

	const onTouchStart = IS_IOS ? () => setIsDragging(false) : undefined;
	const onTouchMove = IS_IOS ? () => setIsDragging(true) : undefined;
	const onTouchEnd = isDragging ? undefined : props.onClick;

	// @ts-expect-error Adding an extra property that's not on the type (onTouchEnd). The real JS uses it.
	return <NavItem {...props} onClick={IS_IOS ? undefined : props.onClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={IS_IOS ? onTouchEnd : undefined} />;
});

export default NavItem2;
