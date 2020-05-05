import * as React from 'react';
import { APP_NAME } from '../../../types';
import './AppNameComponent.css';
import { IVersion } from '../../../reducers/AppReducer';

export interface IAppNameComponentProps {
	version: IVersion;
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
			<span onClick={() => this.props.closeNotepad!()} title={`${APP_NAME} v${major}.${minor}.${patch}-${status}`}>
				{APP_NAME}
				<em
					className="AppNameComponent__version">
					{this.statusToSymbol[status]}
				</em>
			</span>
		);
	}
}
