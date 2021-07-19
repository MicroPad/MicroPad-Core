import { initSentry } from './sentry';
import { isDev } from './app/util';
import * as serviceWorker from './registerServiceWorker';

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if (window.isElectron || isDev(false)) {
	serviceWorker.unregister();
} else {
	serviceWorker.register();
}

initSentry();
import('./app/root');

export {};
