import React from 'react';
import { APP_NAME } from '../../../types';
import { ConnectedProps } from 'react-redux';
import { appSettingsContainer } from './AppSettingsContainer';
import { Button } from 'react-materialize';
import QuickSwitchComponent from '../quick-switch/QuickSwitchContainer';

const AppSettingsComponent = (props: ConnectedProps<typeof appSettingsContainer>) => (
	<div style={{ marginLeft: '10px' }}>
		<strong>{APP_NAME} Controls</strong>

		<ul className="app-settings-component__action-list">
			<li><QuickSwitchComponent /></li>
			<li><Button flat onClick={() => props.feelingLucky()}>I'm feeling lucky</Button></li>
			<li><Button flat onClick={() => props.clearOldData()}>Clear old/unused data</Button></li>
		</ul>
	</div>
);

export default AppSettingsComponent;
