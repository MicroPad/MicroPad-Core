import React from 'react';
import { INotepadsStoreState } from './NotepadTypes';
import { IExplorerState } from '../reducers/ExplorerReducer';
import { ISearchState } from '../reducers/SearchReducer';
import { ICurrentNoteState } from '../reducers/NoteReducer';
import { IPrintStoreState } from '../reducers/PrintReducer';
import { ISyncState } from '../reducers/SyncReducer';
import { IAppStoreState } from '../reducers/AppReducer';
import { IsExportingState } from '../reducers/IsExportingReducer';
import { NotepadPasskeysState } from '../reducers/NotepadPasskeysReducer';
import { EditorState } from '../reducers/EditorReducer';
import { AppInfoState } from '../reducers/AppInfoReducer';
import { DueDateSettingsState } from '../reducers/DueDateSettingsReducer';

export interface IStoreState {
	readonly app: IAppStoreState;
	readonly notepadPasskeys: NotepadPasskeysState;
	readonly notepads: INotepadsStoreState;
	readonly currentNote: ICurrentNoteState;
	readonly explorer: IExplorerState;
	readonly search: ISearchState;
	readonly print: IPrintStoreState;
	readonly sync: ISyncState;
	readonly isExporting: IsExportingState;
	readonly editor: EditorState;
	readonly appInfo: AppInfoState;
	readonly dueDateSettings: DueDateSettingsState;
}
export type PleaseWait = {
	finish: () => void,
};

export type MicroPadGlobals = {
	currentModalId?: string,
	isPersistenceAllowed?: boolean,
};
declare global {
	interface Window {
		MicroPadGlobals: MicroPadGlobals
		isElectron?: boolean,
		isSupported: boolean,
		toastEvent: (guid: string) => void,
		loadingScreen: PleaseWait,

		/** This is just missing from TS typings */
		crossOriginIsolated?: boolean
	}

	/**
	 * Fake globals from the build process
	 */
	const build: {
		defs: {
			SYNC_WORKER_PATH: string,
			SUPPORTED_BROWSERS_REGEX: string,
			MONACO_WORKER_PATH: string,
			FEND_WASM_PATH: string,
			PHOTON_WASM_PATH: string
		}
	}
}

export const APP_NAME = 'µPad';
export const SYNC_NAME = 'µSync';
export const MICROPAD_URL = 'https://getmicropad.com';
export const UNSUPPORTED_MESSAGE = 'Support for this type of content has been removed. You can go to https://getmicropad.com/web to access v2.';
export const BAD_BROWSER_AUDIO = `If your web browser doesn't support this type of audio you can click here to download it.`;

// Help messages
export const NEW_SECTION_HELP = (
	<span>
		<p style={{ marginTop: 0 }}>Sections can go inside notebooks (and other sections). Sections are what hold  your notes.</p>
		<p>Before you create a note you have to create/open a section to put it in.</p>
		This can be done using the sidebar on the right of the screen:
	</span>
);

export const OPEN_NOTE_HELP = (
	<span>
		<p style={{ marginTop: 0 }}>Notes are like whiteboards for you to put elements on.</p>
		<p>Open/create a note to insert text and other elements.</p>
		This can be done using the sidebar on the right of the screen:
	</span>
);

export const OPEN_NOTEPAD_HELP = (
	<span>
		<p style={{ marginTop: 0 }}>Notebooks/notepads are like binders that hold all of your sections and notes.</p>
		Open/create a notebook using the drop-down at the top of the screen.
	</span>
);
