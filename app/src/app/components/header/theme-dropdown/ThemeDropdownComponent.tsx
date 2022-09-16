import React from 'react';
import { Dropdown, Icon } from 'react-materialize';
import { ThemeName } from '../../../types/Themes';
import { ThemeValues } from '../../../ThemeValues';
import NavItem2 from '../../NavItem';

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
					<NavItem2 href="#!" className="header__top-level-item">
						<Icon left={true}>format_paint</Icon> Themes <Icon right={true}>arrow_drop_down</Icon>
					</NavItem2>
				</ul>
			}>
				{
					Object.keys(ThemeValues).map(theme =>
						<NavItem2 key={theme} onClick={() => select(theme as ThemeName)}>
							{theme} {selectedTheme === theme && <Icon left={true}>done</Icon>}
						</NavItem2>
					)
				}
			</Dropdown>
		);
	}
}
