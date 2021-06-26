import * as React from 'react';
import { Dropdown, Icon, NavItem } from 'react-materialize';
import { ThemeName } from '../../types/Themes';
import { ThemeValues } from '../../ThemeValues';

export interface IThemeDropdownComponentProps {
	selectedTheme: ThemeName;
	select?: (theme: ThemeName) => void;
}

export default class ThemeDropdownComponent extends React.Component<IThemeDropdownComponentProps> {
	render() {
		const { selectedTheme, select } = this.props;
		if (!select) return null;

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
						<NavItem key={theme} href="#!" onClick={() => select(theme as ThemeName)}>
							{theme} {selectedTheme === theme && <Icon left={true}>done</Icon>}
						</NavItem>
					)
				}
			</Dropdown>
		);
	}
}
