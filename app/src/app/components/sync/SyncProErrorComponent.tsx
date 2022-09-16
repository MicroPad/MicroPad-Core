import React from 'react';
import { MICROPAD_URL, SYNC_NAME } from '../../types';
import { DEFAULT_MODAL_OPTIONS } from '../../util';
import SingletonModalComponent from '../singleton-modal/SingletonModalContainer';
import Button2 from '../Button';

export const SyncProErrorComponent = () => (
	/* eslint-disable jsx-a11y/anchor-has-content */
	<SingletonModalComponent
		id="sync-pro-error-modal"
		header="Good and bad news"
		options={DEFAULT_MODAL_OPTIONS}>
		<div>
			<p>
				The good news is that you're using your notebook well with lots of images, recordings, files, and/or drawings!
			</p>

			<p>
				The bad news is that these notepads take up a lot more resources to keep in-sync.<br />
				To sync this notepad you'll need to upgrade to {SYNC_NAME} Pro for less than the price of a cup of coffee:
			</p>

			<Button2 className="accent-btn" waves="light" onClick={() => window.open(`${MICROPAD_URL}/sync/manage`, '_blank')}>Upgrade here</Button2>
		</div>
	</SingletonModalComponent>
);
