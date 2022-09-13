import React from 'react';
import { Dropdown, Icon, NavItem } from 'react-materialize';
import { ThemeName } from '../../../types/Themes';
import { ThemeValues } from '../../../ThemeValues';
import { isIOS } from '../../../services/BrowserDetection';

export interface IThemeDropdownComponentProps {
	selectedTheme: ThemeName;
	select?: (theme: ThemeName) => void;
}

export default class ThemeDropdownComponent extends React.Component<IThemeDropdownComponentProps> {
	render() {
		const { selectedTheme, select } = this.props;
		if (!select) return null;

		const handleChange = (name: string) => () => select(name as ThemeName);
		const onClick = (name: string) => !isIOS() ? handleChange(name) : undefined;

		return (
			<Dropdown trigger={
				<ul>
					<NavItem href="#!" className="header__top-level-item">
						<Icon left={true}>format_paint</Icon> Themes <Icon right={true}>arrow_drop_down</Icon>
					</NavItem>
				</ul>
			}>
				{
					Object.keys(ThemeValues).map(theme =>
						// @ts-expect-error
						<NavItem key={theme} href="#!" onClick={onClick(theme)} onTouchEnd={handleChange(theme)}>
							{theme} {selectedTheme === theme && <Icon left={true}>done</Icon>}
						</NavItem>
					)
				}
			</Dropdown>
		);
	}
}
