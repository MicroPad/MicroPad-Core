/* Special Imports */
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '!raw-loader!./assets/Help.npx';
/* CSS Imports */
import '@fontsource/abeezee';
import 'material-icons-font/material-icons-font.css';
import 'materialize-css/dist/css/materialize.min.css';
import './root.css';
import './ScrollbarPatch.css';
/* Themes */
import './theme-styles/Solarized.css';
import './theme-styles/Midnight.css';
import './theme-styles/Void.css';
import './theme-styles/Wellington.css';
import './theme-styles/Peach.css';
import './theme-styles/Pastel.css';
import './theme-styles/Purple.css';
/* JS Imports */
import * as React from 'react';
import 'materialize-css/dist/js/materialize.js';
import * as serviceWorker from '../registerServiceWorker';
import { APP_NAME, MICROPAD_URL } from './types';
import { applyMiddleware, compose, createStore } from 'redux';
import { BaseReducer } from './reducers/BaseReducer';
import { epicMiddleware } from './epics';
import { composeWithDevTools } from 'redux-devtools-extension';
import * as localforage from 'localforage';
import * as ReactDOM from 'react-dom';
import { actions } from './actions';
import { Provider } from 'react-redux';
import HeaderComponent from './containers/header/HeaderContainer';
import NotepadExplorerComponent from './components/explorer/NotepadExplorerContainer';
import NoteViewerComponent from './containers/NoteViewerContainer';
import { enableKeyboardShortcuts } from './services/shortcuts';
import * as PasteImage from 'paste-image';
import PrintViewOrAppContainerComponent from './containers/PrintViewContainer';
import NoteElementModalComponent from './components/note-element-modal/NoteElementModalComponent';
import { SyncUser } from './types/SyncTypes';
import { SyncProErrorComponent } from './components/sync/SyncProErrorComponent';
import InsertElementComponent from './containers/InsertElementContainer';
import { ThemeName } from './types/Themes';
import AppBodyComponent from './containers/AppBodyContainer';
import ToastEventHandler from './services/ToastEventHandler';
import { LastOpenedNotepad } from './epics/StorageEpics';
import { noop } from './util';
import { createSentryReduxEnhancer } from '../sentry';
import { createDynamicCss } from './DynamicAppCss';

window.MicroPadGlobals = {};

try {
	document.domain = MICROPAD_URL.split('//')[1];
} catch (err) {
	console.warn(`Couldn't set domain for resolving CORS. If this is prod change 'MICROPAD_URL'.`);
}

const baseReducer: BaseReducer = new BaseReducer();
export const store = createStore(
	baseReducer.reducer,
	baseReducer.initialState,
	composeWithDevTools(compose(applyMiddleware(epicMiddleware), createSentryReduxEnhancer()))
);

export const TOAST_HANDLER = new ToastEventHandler();

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

export const SETTINGS_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'settings'
});

export type StorageMap = {
	notepadStorage: LocalForage,
	assetStorage: LocalForage,
	syncStorage: LocalForage,
	settingsStorage: LocalForage,

	/** @deprecated Use settingsStorage instead */
	generalStorage: LocalForage
};

export function getStorage(): StorageMap {
	return {
		notepadStorage: NOTEPAD_STORAGE,
		assetStorage: ASSET_STORAGE,
		syncStorage: SYNC_STORAGE,
		settingsStorage: SETTINGS_STORAGE,
		generalStorage: localforage
	};
}

(async function init() {
	if (!await compatibilityCheck()) return;
	await hydrateStoreFromLocalforage();
	createDynamicCss(store);

	if (window.isElectron) store.dispatch(actions.checkVersion(undefined));
	store.dispatch(actions.getNotepadList.started(undefined));
	store.dispatch(actions.indexNotepads.started(undefined));

	enableKeyboardShortcuts(store);

	// Render the main UI
	ReactDOM.render(
		<Provider store={store}>
			{/*
			// @ts-ignore TODO: Type has no properties in common with type 'IntrinsicAttributes & Pick ClassAttributes PrintViewOrAppContainerComponent & IPrintViewComponentProps & IAppProps, "ref" | "key">' */}
			<PrintViewOrAppContainerComponent>
				<HeaderComponent />
				<AppBodyComponent>
					<NoteViewerComponent />
					<NotepadExplorerComponent />
					<NoteElementModalComponent id={"whats-new-modal"} npx={helpNpx} findNote={np => np.sections[0].notes[2]} />
					<SyncProErrorComponent />
					<InsertElementComponent />
				</ AppBodyComponent>
			</PrintViewOrAppContainerComponent>
		</Provider>,
		document.getElementById('app') as HTMLElement
	);

	// Some clean up of an old storage item, this line can be deleted at some point in the future
	localforage.removeItem('hasRunBefore').then(noop);

	await displayWhatsNew();

	notepadDownloadHandler();

	pasteWatcher();

	store.dispatch(actions.clearOldData.started({ silent: true }));

	// Show a warning when closing before notepad save or sync is complete
	store.subscribe(() => {
		const isSaving = store.getState().notepads.isLoading || store.getState().notepads.notepad?.isLoading;
		const isSyncing = store.getState().sync.isLoading;
		window.onbeforeunload = (isSyncing || isSaving) ? () => true : null;
	});
})();

async function hydrateStoreFromLocalforage() {
	await Promise.all(Object.values(getStorage()).map(storage => storage.ready()));

	const fontSize = await localforage.getItem<string>('font size');
	if (!!fontSize) store.dispatch(actions.updateDefaultFontSize(fontSize));

	const helpPref: boolean | null = await localforage.getItem<boolean>('show help');
	if (helpPref !== null) store.dispatch(actions.setHelpPref(helpPref));

	const syncUser: SyncUser | null = await SYNC_STORAGE.getItem<SyncUser>('sync user');
	if (!!syncUser && !!syncUser.token && !!syncUser.username) store.dispatch(actions.syncLogin.done({ params: {} as any, result: syncUser }));

	const theme = await localforage.getItem<ThemeName>('theme');
	if (!!theme) store.dispatch(actions.selectTheme(theme));

	// Reopen the last notebook + note
	const lastOpenedNotepad = await localforage.getItem<string | LastOpenedNotepad>('last opened notepad');
	if (typeof lastOpenedNotepad === 'string') {
		store.dispatch(actions.openNotepadFromStorage.started(lastOpenedNotepad));
	} else if (!!lastOpenedNotepad) {
		const { notepadTitle, noteRef } = lastOpenedNotepad;
		if (noteRef) {
			store.dispatch(actions.restoreJsonNotepadAndLoadNote({ notepadTitle, noteRef }));
		} else {
			store.dispatch(actions.openNotepadFromStorage.started(notepadTitle));
		}
	}
}

async function compatibilityCheck(): Promise<boolean> {
	function doesSupportSrcDoc(): boolean {
		const testIframe = document.createElement('iframe');
		testIframe.srcdoc = 'test';
		return testIframe.getAttribute('srcdoc') === 'test';
	}
	function hasUrlHelperClasses(): boolean {
		try {
			const url = new URL('https://example.com');
			return !!new URLSearchParams(url.search);
		} catch (_) { return false; }
	}

	if (!(doesSupportSrcDoc() && hasUrlHelperClasses())) {
		ReactDOM.render(
			<div style={{ margin: '10px' }}>
				<h1>Bad news <span role="img" aria-label="sad face">😢</span></h1>
				<p>
					Your web-browser doesn't support important features required for {APP_NAME} to function.<br />
					You can try with a more modern browser like <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer nofollow">Google Chrome</a> or <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer nofollow">Mozilla Firefox</a>.
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
	setTimeout(() => {
		const whatsNewModal = document.getElementById('whats-new-modal');
		if (whatsNewModal) {
			M.Modal.getInstance(whatsNewModal).open();
		} else {
			console.error('Missing whats new modal');
		}
	}, 0);

	await localforage.setItem('oldMinorVersion', minorVersion);
}

function notepadDownloadHandler() {
	// eslint-disable-next-line no-restricted-globals
	const downloadNotepadUrl = new URLSearchParams(location.search).get('download');
	if (!!downloadNotepadUrl) store.dispatch(actions.downloadNotepad.started(downloadNotepadUrl));
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if (window.isElectron) {
	serviceWorker.unregister();
} else {
	serviceWorker.register();
}
