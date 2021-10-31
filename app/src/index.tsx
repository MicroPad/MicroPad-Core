import { isDev } from './app/util';
import * as serviceWorker from './registerServiceWorker';
import { initWasm } from './app/init-wasm';

// `window.isSupported` is set by the Unsupported Browser logic.
if (window.isSupported) {
	// eslint-disable-next-line no-restricted-globals
	const params = new URLSearchParams(location.search);
	const isInTest = params.has('integration');

	if (!isInTest && navigator.storage && navigator.storage.persist) {
		navigator.storage.persist().then(storageAllowed => {
			if (!storageAllowed) {
				console.warn(`Failed to get permission for long-term storage. Notebooks may be removed from your devices storage under storage pressure.`);
			}
			initMicroPad();
		});
	} else {
		initMicroPad();
	}
}

function initMicroPad() {
	// If you want your app to work offline and load faster, you can change
	// unregister() to register() below. Note this comes with some pitfalls.
	// Learn more about service workers: https://bit.ly/CRA-PWA
	if (window.isElectron || isDev(false)) {
		serviceWorker.unregister();
	} else {
		serviceWorker.register();
	}

	initWasm().then(() => import('./app/root'));
}

export {};
