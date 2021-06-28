import * as React from 'react';
import { APP_NAME } from '../../../types';
import { ConnectedProps } from 'react-redux';
import { appSettingsContainer } from './AppSettingsContainer';
import { Button } from 'react-materialize';
import { Dialog } from '../../../services/dialogs';

const AppSettingsComponent = (props: ConnectedProps<typeof appSettingsContainer>) => (
	<div style={{ marginLeft: '10px' }}>
		<strong>{APP_NAME} Controls</strong>

		<ul className="app-settings-component__action-list">
			<li><Button flat onClick={() => Dialog.alert(`Nick hasn't done this thing yet`)}>Quick notebook switcher</Button></li> {/* TODO */}
			<li><Button flat onClick={() => props.feelingLucky()}>I'm feeling lucky</Button></li>
			<li><Button flat onClick={() => props.clearOldData()}>Clear old data</Button></li>
		</ul>
	</div>
);

export default AppSettingsComponent;
