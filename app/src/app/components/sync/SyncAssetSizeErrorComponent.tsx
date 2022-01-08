import React from 'react';
import { DEFAULT_MODAL_OPTIONS } from '../../util';
import SingletonModalComponent from '../singleton-modal/SingletonModalContainer';
import { SYNC_ASSET_OVERSIZED_MESSAGE, SYNC_ASSET_OVERSIZED_MODAL_TITLE } from '../../strings.enNZ';

export const SyncAssetSizeErrorComponent = () => (
	<SingletonModalComponent
		id="sync-oversized-assets-modal"
		header={SYNC_ASSET_OVERSIZED_MODAL_TITLE}
		options={DEFAULT_MODAL_OPTIONS}>
		<p>
			{SYNC_ASSET_OVERSIZED_MESSAGE}
		</p>
	</SingletonModalComponent>
);
