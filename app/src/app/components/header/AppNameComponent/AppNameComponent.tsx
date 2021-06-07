import * as React from 'react';
import { APP_NAME } from '../../../types';
import './AppNameComponent.css';
import { IVersion } from '../../../reducers/AppReducer';
import { ITheme } from '../../../types/Themes';

export interface IAppNameComponentProps {
	version: IVersion;
	theme: ITheme;
	closeNotepad?: () => void;
}

export default class AppNameComponent extends React.Component<IAppNameComponentProps> {
	private readonly statusToSymbol = {
		dev: 'ρ',
		alpha: 'α',
		beta: 'β',
		stable: ''
	};

	render() {
		const { major, minor, patch, status } = this.props.version;

		return (
			<span
				className="header__app-name brand-logo"
				style={{ color: this.props.theme.explorerContent }}
				onClick={() => this.props.closeNotepad!()}
				title={`${APP_NAME} v${major}.${minor}.${patch}-${status}`}>
				{APP_NAME}
				<em
					className="AppNameComponent__version">
					{this.statusToSymbol[status]}
				</em>
			</span>
		);
	}
}
