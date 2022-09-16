import React from 'react';
import { SyncProErrorComponent } from './sync/SyncProErrorComponent';
import QuickSwitchComponent from './explorer/quick-switch/QuickSwitchContainer';

const TopLevelModalsComponent = () => (
	<React.Fragment>
		<SyncProErrorComponent />
		<QuickSwitchComponent />
	</React.Fragment>
);

export default TopLevelModalsComponent;
