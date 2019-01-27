import * as React from 'react';
import { APP_NAME } from '../../../../core/types';
import './AppNameComponent.css';
import { IVersion } from '../../../../core/reducers/AppReducer';

export default class AppNameComponent extends React.Component<IVersion> {
	private readonly statusToSymbol = {
		dev: 'ρ',
		alpha: 'α',
		beta: 'β',
		stable: ''
	};

	render() {
		const { major, minor, patch, status } = this.props;

		return (
			<span title={`${APP_NAME} v${major}.${minor}.${patch}-${status}`}>
				{APP_NAME}
				<em
					className="AppNameComponent__version">
					{this.statusToSymbol[status]}
				</em>
			</span>
		);
	}
}
