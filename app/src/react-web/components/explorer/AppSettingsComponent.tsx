import * as React from 'react';
import { APP_NAME } from '../../../core/types';
import { Dialog } from '../../dialogs';

export default class AppSettingsComponent extends React.Component {
	render() {
		return (
			<div style={{ marginLeft: '10px' }}>
				<strong>{APP_NAME} Controls</strong>

				<ul className="app-settings-component__action-list">
					<li><a href="#!" onClick={() => setTimeout(() => Dialog.alert(`Nick hasn't done this thing yet`), 0)}>Quick notebook switcher</a></li>
					<li><a href="#!">Clear old data</a></li>
				</ul>
			</div>
		);
	}
}
