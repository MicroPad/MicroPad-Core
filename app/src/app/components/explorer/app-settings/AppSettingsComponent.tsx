import * as React from 'react';
import { APP_NAME } from '../../../types';
import { ConnectedProps } from 'react-redux';
import { appSettingsContainer } from './AppSettingsContainer';

const AppSettingsComponent = (props: ConnectedProps<typeof appSettingsContainer>) => (
	<div style={{ marginLeft: '10px' }}>
		<strong>{APP_NAME} Controls</strong>

		<ul className="app-settings-component__action-list">
			{/*<li><a href="#!" onClick={() => setTimeout(() => Dialog.alert(`Nick hasn't done this thing yet`), 0)}>Quick notebook switcher</a></li>*/}
			<li><a href="#!" onClick={() => props.clearOldData()}>Clear old data</a></li>
		</ul>
	</div>
);

export default AppSettingsComponent;
