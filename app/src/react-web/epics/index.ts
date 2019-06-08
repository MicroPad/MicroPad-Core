// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { noteEpics$ } from './NoteEpics';
import { ExplorerEpics } from '../../core/epics/ExplorerEpics';
import { AppEpics } from './AppEpics';
import { PrintEpics } from './PrintEpics';
import { SyncEpics } from './SyncEpics';
import { HelpEpics } from './HelpEpics';
import { SearchEpics } from '../../core/epics/SearchEpics';
import { getStorage } from '..';
import { Action } from 'redux-typescript-actions';
import { CryptoEpics } from './CryptoEpics';
import { Dialog } from '../dialogs';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	HelpEpics.helpEpics$,
	SearchEpics.searchEpics$,
	noteEpics$,
	ExplorerEpics.explorerEpics$,
	AppEpics.appEpics$,
	PrintEpics.printEpics$,
	SyncEpics.syncEpics$,
	CryptoEpics.cryptoEpics$
);

export type EpicDeps = {
	helpNpx: string,
	getStorage: () => { [name: string]: LocalForage },
	Dialog: Dialog
};

export const epicMiddleware = createEpicMiddleware<Action<any>, any, EpicDeps>(baseEpic$, {
	dependencies: {
		helpNpx,
		getStorage: getStorage,
		Dialog: Dialog
	}
});
