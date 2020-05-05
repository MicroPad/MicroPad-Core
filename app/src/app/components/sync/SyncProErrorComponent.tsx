import * as React from 'react';
import { Button, Modal } from 'react-materialize';
import { MICROPAD_URL, SYNC_NAME } from '../../types';

export const SyncProErrorComponent = () => (
	<Modal
		trigger={<a id="sync-pro-error-trigger" href="#!" />}
		header="Good and bad news">
		<div>
			<p>
				The good news is that you're using your notepad well with lots of images, recordings, files, and/or drawings!
			</p>

			<p>
				The bad news is that these notepads take up a lot more resources to keep in sync.<br />
				To sync this notepad you'll need to upgrade to {SYNC_NAME} Pro for less than the price of a cup of coffee:
			</p>

			<Button className="blue" waves="light" onClick={() => window.open(`${MICROPAD_URL}/sync/manage`, '_blank')}>Upgrade here</Button>
		</div>
	</Modal>
);
