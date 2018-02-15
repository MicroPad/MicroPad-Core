import * as React from 'react';
import { IVersion } from '../../../types/MetaTypes';
import { APP_NAME } from '../../../types/index';
import './AppNameComponent.css';

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
			<span>
				{APP_NAME}
				<em
					className="AppNameComponent__version"
					title={`v${major}.${minor}.${patch}-${status}`}>
					{this.statusToSymbol[status]}
				</em>
			</span>
		);
	}
}
