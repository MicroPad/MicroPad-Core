/* CSS Imports */
import 'material-icons-font/material-icons-font.css';
import 'materialize-css/dist/css/materialize.min.css'; // TODO: Roboto will need to be imported here when this isn't
import './index.css';

/* Themes */
import './theme-styles/Classic.css';
import './theme-styles/Solarized.css';
import './theme-styles/IanPad.css';
import './theme-styles/Midnight.css';
import './theme-styles/Purple.css';

/* JS Imports */
import * as React from 'react';
import 'jquery/dist/jquery.slim.js'; // TODO: Yeet this when Materialize is removed
import 'materialize-css/dist/js/materialize.js';
import registerServiceWorker from './registerServiceWorker';
import { APP_NAME, IStoreState, MICROPAD_URL } from '../core/types';
import { applyMiddleware, createStore, Store } from 'redux';
import { BaseReducer } from '../core/reducers/BaseReducer';
import { epicMiddleware } from './epics';
import { composeWithDevTools } from 'redux-devtools-extension';
import * as localforage from 'localforage';
import * as ReactDOM from 'react-dom';
import { actions } from '../core/actions';
import { Provider } from 'react-redux';
import HeaderComponent from './containers/header/HeaderContainer';
import NotepadExplorerComponent from './containers/NotepadExplorerContainer';
import NoteViewerComponent from './containers/NoteViewerContainer';
import { enableKeyboardShortcuts } from './shortcuts';
import * as QueryString from 'querystring';
import * as PasteImage from 'paste-image';
import PrintViewOrAppContainerComponent from './containers/PrintViewContainer';
import WhatsNewModalComponent from './components/WhatsNewModalComponent';
import { SyncUser } from '../core/types/SyncTypes';
import { INotepadStoreState } from '../core/types/NotepadTypes';
import { SyncProErrorComponent } from './components/sync/SyncProErrorComponent';
import InsertElementComponent from './containers/InsertElementContainer';
import { ThemeName } from '../core/types/Themes';
import AppBodyComponent from './containers/AppBodyContainer';
import ToastEventHandler from './ToastEventHandler';
import { isElection } from './util';
import { Action } from 'redux-typescript-actions';
import { baseEpic$ } from '../core/epics/BaseEpics';

try {
	document.domain = MICROPAD_URL.split('//')[1];
} catch (err) {
	console.warn(`Couldn't set domain for resolving CORS. If this is prod change 'MICROPAD_URL'.`);
}

const baseReducer: BaseReducer = new BaseReducer();
export const store: Store<IStoreState, Action<any>> = createStore<IStoreState, Action<any>, unknown, unknown>(
	baseReducer.reducer,
	composeWithDevTools(
		applyMiddleware(
			epicMiddleware
		)
	)
);

// Start the epic listener for side-effect execution
epicMiddleware.run(baseEpic$);

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

export const TOAST_HANDLER = new ToastEventHandler();

export function getStorage(): { [name: string]: LocalForage } {
	return {
		notepadStorage: NOTEPAD_STORAGE,
		assetStorage: ASSET_STORAGE,
		syncStorage: SYNC_STORAGE
	};
}

(async function init() {
	if (!await compatibilityCheck()) return;
	await hydrateStoreFromLocalforage();

	if (isElection()) store.dispatch(actions.checkVersion(undefined));
	store.dispatch(actions.getNotepadList.started(undefined));
	store.dispatch(actions.indexNotepads.started(undefined));

	enableKeyboardShortcuts(store);
	registerServiceWorker();

	// Render the main UI
	ReactDOM.render(
		<Provider<Action<any>> store={store}>
			<PrintViewOrAppContainerComponent>
				<HeaderComponent />
				<AppBodyComponent>
					<NoteViewerComponent />
					<NotepadExplorerComponent />
					<WhatsNewModalComponent />
					<SyncProErrorComponent />
					<InsertElementComponent />
				</ AppBodyComponent>
			</PrintViewOrAppContainerComponent>
		</Provider>,
		document.getElementById('app') as HTMLElement
	);

	if (!await localforage.getItem('hasRunBefore')) store.dispatch(actions.getHelp.started());
	await localforage.setItem('hasRunBefore', true);

	await displayWhatsNew();

	notepadDownloadHandler();

	pasteWatcher();

	// Show a warning when closing before notepad save or sync is complete
	store.subscribe(() => {
		const isSaving = store.getState().notepads.isLoading || (store.getState().notepads.notepad || {} as INotepadStoreState).isLoading;
		const isSyncing = store.getState().sync.isLoading;
		window.onbeforeunload = (isSyncing || isSaving) ? () => true : null;
	});
})();

async function hydrateStoreFromLocalforage() {
	await Promise.all([NOTEPAD_STORAGE.ready(), ASSET_STORAGE.ready(), SYNC_STORAGE.ready()]);

	const fontSize = await localforage.getItem<string>('font size');
	if (!!fontSize) store.dispatch(actions.updateDefaultFontSize(fontSize));

	const helpPref: boolean | null = await localforage.getItem<boolean>('show help');
	if (helpPref !== null) store.dispatch(actions.setHelpPref(helpPref));

	const syncUser: SyncUser = await SYNC_STORAGE.getItem<SyncUser>('sync user');
	if (!!syncUser && !!syncUser.token && !!syncUser.username) store.dispatch(actions.syncLogin.done({ params: {} as any, result: syncUser }));

	const theme = await localforage.getItem<ThemeName>('theme');
	if (!!theme) store.dispatch(actions.selectTheme(theme));

	const lastOpenedNotepad = await localforage.getItem<string>('last opened notepad');
	if (!!lastOpenedNotepad) store.dispatch(actions.openNotepadFromStorage.started(lastOpenedNotepad));
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
					Your web-browser doesn't support important features required for {APP_NAME} to function.<br />
					You can try with a more modern browser like <a href="https://www.google.com/chrome/" target="_blank" rel="nofollow noreferrer">Google Chrome</a> or <a href="https://www.mozilla.org/firefox/" target="_blank" rel="nofollow noreferrer">Mozilla Firefox</a>.
				</p>
				<p>
					You could also download {APP_NAME} <a href="https://getmicropad.com/#download">here</a>.
				</p>
			</div>,
			document.getElementById('app') as HTMLElement
		);
		return false;
	}

	return true;
}

async function displayWhatsNew() {
	const minorVersion = store.getState().app.version.minor;
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

function pasteWatcher() {
	/*
		The paste watcher breaks text inputs in Safari (https://github.com/MicroPad/Web/issues/179).
		TODO: Consider re-enabling this when https://github.com/MicroPad/Web/issues/143 is done.
	*/
	const isSafariLike = navigator.vendor === 'Apple Computer, Inc.';
	if (isSafariLike) return;

	PasteImage.on('paste-image', async (image: HTMLImageElement) => {
		store.dispatch(actions.imagePasted.started(image.src));
	});
}
