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
import * as QueryString from 'querystring';
import PrintViewOrAppContainerComponent from './containers/PrintViewContainer';
import WhatsNewModalComponent from './components/WhatsNewModalComponent';
import { SyncUser } from './types/SyncTypes';
import * as Materialize from 'materialize-css/dist/js/materialize';
import { INotepadStoreState } from './types/NotepadTypes';
import { cleanHangingAssets } from './util';
import { SyncProErrorComponent } from './components/sync/SyncProErrorComponent';
import InsertElementComponent from './containers/InsertElementContainer';

try {
	document.domain = MICROPAD_URL.split('//')[1];
} catch (err) {
	console.warn(`Couldn't set domain for resolving CORS. If this is prod change 'MICROPAD_URL'.`);
}

const baseReducer: BaseReducer = new BaseReducer();
export const store = createStore<IStoreState>(
	baseReducer.reducer,
	baseReducer.initialState,
	composeWithDevTools(applyMiddleware(epicMiddleware))
);

export const NOTEPAD_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'notepads'
});

export const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
});

export const SYNC_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'sync'
});

(async function init() {
	if (!await compatibilityCheck()) return;
	await hydrateStoreFromLocalforage();

	enableKeyboardShortcuts(store);
	registerServiceWorker();

	// Render the main UI
	ReactDOM.render(
		<Provider store={store}>
			<PrintViewOrAppContainerComponent>
				<HeaderComponent />
				<div id="body">
					<NoteViewerComponent />
					<NotepadExplorerComponent />
					<WhatsNewModalComponent />
					<SyncProErrorComponent />
					<InsertElementComponent />
				</div>
			</PrintViewOrAppContainerComponent>
		</Provider>,
		document.getElementById('app') as HTMLElement
	);

	if (!await localforage.getItem('hasRunBefore')) store.dispatch(actions.getHelp(undefined));
	await localforage.setItem('hasRunBefore', true);

	await displayWhatsNew();

	notepadDownloadHandler();

	// Handle sync download toast
	window['syncDownload'] = (syncId: string) => {
		Materialize.Toast.removeAll();
		store.dispatch(actions.syncDownload.started(syncId));
	};

	// Show a warning when closing before notepad save or sync is complete
	store.subscribe(() => {
		const isSaving = store.getState().notepads.isLoading || (store.getState().notepads.notepad || {} as INotepadStoreState).isLoading;
		const isSyncing = store.getState().sync.isLoading;
		window.onbeforeunload = (isSyncing || isSaving) ? () => true : null;
	});
})();

async function hydrateStoreFromLocalforage() {
	await Promise.all([NOTEPAD_STORAGE.ready(), ASSET_STORAGE.ready(), SYNC_STORAGE.ready()]);

	await cleanHangingAssets(NOTEPAD_STORAGE, ASSET_STORAGE);

	const fontSize = await localforage.getItem<string>('font size');
	if (!!fontSize) store.dispatch(actions.updateDefaultFontSize(fontSize));

	const helpPref: boolean | null = await localforage.getItem<boolean>('show help');
	if (helpPref !== null) store.dispatch(actions.setHelpPref(helpPref));

	const syncUser: SyncUser = await SYNC_STORAGE.getItem<SyncUser>('sync user');
	if (!!syncUser && !!syncUser.token && !!syncUser.username) store.dispatch(actions.syncLogin.done({ params: {} as any, result: syncUser }));

	if ((window as any).isElectron) store.dispatch(actions.checkVersion(undefined));

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
