import React from 'react';
import { APP_NAME } from '../../../types';
import './AppNameComponent.css';
import { ConnectedProps } from 'react-redux';
import { appNameConnector } from './AppNameContainer';

export default class AppNameComponent extends React.Component<ConnectedProps<typeof appNameConnector>> {
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
