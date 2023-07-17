import { isDev } from './app/util';
import * as serviceWorker from './registerServiceWorker';
import { initWasm } from './app/init-wasm';

window.MicroPadGlobals = {};

// `window.isSupported` is set by the Unsupported Browser logic.
if (window.isSupported) {
	// eslint-disable-next-line no-restricted-globals
	const params = new URLSearchParams(location.search);
	const isInTest = params.has('integration');

	if (!isInTest && navigator.storage && navigator.storage.persist) {
		navigator.storage.persist().then(handleStorageReq).catch(err => {
			console.error(err);
			handleStorageReq(false);
		});
	} else {
		window.MicroPadGlobals.isPersistenceAllowed = true;
		initMicroPad();
	}
}

function handleStorageReq(isStorageAllowed: boolean) {
	window.MicroPadGlobals.isPersistenceAllowed = isStorageAllowed;
	if (!isStorageAllowed) {
		console.warn(`Failed to get permission for long-term storage. Notebooks may be removed from your device's storage under storage pressure.`);
	}
	initMicroPad();
}

function initMicroPad() {
	if (window.isElectron || isDev(false)) {
		serviceWorker.unregister();
	} else {
		serviceWorker.register();
	}

	initWasm()
		.then(() => import('./app/root'))
		.then(root => root.init());
}

export {};
