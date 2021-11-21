import React from 'react';
import { SyncProErrorComponent } from './sync/SyncProErrorComponent';
import { SyncAssetSizeErrorComponent } from './sync/SyncAssetSizeErrorComponent';

const InfoModalsComponent = () => (
	<React.Fragment>
		<SyncProErrorComponent />
		<SyncAssetSizeErrorComponent />
	</React.Fragment>
);

export default InfoModalsComponent;
