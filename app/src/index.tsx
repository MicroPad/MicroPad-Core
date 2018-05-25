import 'material-icons-font/material-icons-font.css';
import 'materialize-css/dist/css/materialize.min.css';
import 'jquery/dist/jquery.slim.js';
import 'materialize-css/dist/js/materialize.js';
import * as React from 'react';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { APP_NAME, IStoreState, MICROPAD_URL } from './types';
import { applyMiddleware, createStore } from 'redux';
import { BaseReducer } from './reducers/BaseReducer';
import { epicMiddleware } from './epics';
import { composeWithDevTools } from 'redux-devtools-extension';
import * as localforage from 'localforage';
import * as ReactDOM from 'react-dom';
import { actions } from './actions';
import { Provider } from 'react-redux';
import HeaderComponent from './containers/header/HeaderContainer';
import NotepadExplorerComponent from './containers/NotepadExplorerContainer';
import NoteViewerComponent from './containers/NoteViewerContainer';
import { enableKeyboardShortcuts } from './shortcuts';
import { OldSyncHandler } from './old-sync/OldSyncHandler';
import * as QueryString from 'querystring';
import * as PrintTemplate from 'react-print';
import PrintViewComponent from './containers/PrintViewContainer';
import { isDev } from './util';
import WhatsNewModalComponent from './components/WhatsNewModalComponent';

try {
	document.domain = MICROPAD_URL.split('//')[1];
} catch (err) {
	console.warn(`Couldn't set domain for resolving CORS. If this is prod change 'MICROPAD_URL'.`);
}

const baseReducer: BaseReducer = new BaseReducer();
const store = createStore<IStoreState>(
	baseReducer.reducer,
	baseReducer.initialState,
	(isDev()) ? composeWithDevTools(applyMiddleware(epicMiddleware)) : applyMiddleware(epicMiddleware)
);

export const NOTEPAD_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'notepads'
});

export const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
});

(async function init() {
	if (!await compatibilityCheck()) return;
	await hydrateStoreFromLocalforage();

	new OldSyncHandler(store);
	enableKeyboardShortcuts(store);
	registerServiceWorker();

	// Render the main UI
	ReactDOM.render(
		<Provider store={store}>
			<div>
				<HeaderComponent />
				<div id="body">
					<NoteViewerComponent />
					<NotepadExplorerComponent />
					<WhatsNewModalComponent />
				</div>
			</div>
		</Provider>,
		document.getElementById('react-no-print') as HTMLElement
	);

	// Render the print UI
	ReactDOM.render(
		<PrintTemplate>
			<Provider store={store}>
				<PrintViewComponent />
			</Provider>
		</PrintTemplate>,
		document.getElementById('print-mount') as HTMLElement
	);

	if (!await localforage.getItem('hasRunBefore')) store.dispatch(actions.getHelp(undefined));
	await localforage.setItem('hasRunBefore', true);

	await displayWhatsNew();

	notepadDownloadHandler();
})();

async function hydrateStoreFromLocalforage() {
	await Promise.all([NOTEPAD_STORAGE.ready(), ASSET_STORAGE.ready()]);
	const fontSize = await localforage.getItem<string>('font size');
	if (!!fontSize) store.dispatch(actions.updateDefaultFontSize(fontSize));

	store.dispatch(actions.getNotepadList.started(undefined));
}

async function compatibilityCheck(): Promise<boolean> {
	function doesSupportSrcDoc(): boolean {
		const testIframe = document.createElement('iframe');
		testIframe.srcdoc = 'test';
		return testIframe.getAttribute('srcdoc') === 'test';
	}

	if (!doesSupportSrcDoc()) {
		ReactDOM.render(
			<div style={{ margin: '10px' }}>
				<h1>Bad news 😢</h1>
				<p>
					Your web-browser doesn't support important security features required for {APP_NAME} v{store.getState().meta.version.major} to function.<br />
					Try with a more modern browser like <a href="https://www.google.com/chrome/" target="_blank" rel="nofollow noreferrer">Google Chrome</a> or <a href="https://www.mozilla.org/firefox/" target="_blank" rel="nofollow noreferrer">Mozilla Firefox</a>.
				</p>
				<p>
					You can always use the old {APP_NAME} <a href="https://getmicropad.com/web">here</a>.
				</p>
			</div>,
			document.getElementById('react-no-print') as HTMLElement
		);
		return false;
	}

	return true;
}

async function displayWhatsNew() {
	const minorVersion = store.getState().meta.version.minor;
	const oldMinorVersion = await localforage.getItem('oldMinorVersion');
	if (minorVersion === oldMinorVersion) return;

	// Open "What's New"
	document.getElementById('whats-new-modal-trigger')!.click();
	await localforage.setItem('oldMinorVersion', minorVersion);
}

function notepadDownloadHandler() {
	const downloadNotepadUrl = QueryString.parse(location.search.slice(1)).download;
	if (!!downloadNotepadUrl && typeof downloadNotepadUrl === 'string') store.dispatch(actions.downloadNotepad.started(downloadNotepadUrl));
}
