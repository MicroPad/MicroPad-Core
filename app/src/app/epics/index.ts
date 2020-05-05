// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '!raw-loader!../assets/Help.npx';

import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { noteEpics$ } from './NoteEpics';
import { appEpics$ } from './AppEpics';
import { Action } from 'redux-typescript-actions';
import { cryptoEpics$ } from './CryptoEpics';
import { Dialog } from '../services/dialogs';
import { getStorage } from '../root';
import { printEpics$ } from './PrintEpics';
import { helpEpics$ } from './HelpEpics';
import { searchEpics$ } from './SearchEpics';
import { syncEpics$ } from './SyncEpics';
import { explorerEpics$ } from './ExplorerEpics';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	helpEpics$,
	searchEpics$,
	noteEpics$,
	explorerEpics$,
	appEpics$,
	printEpics$,
	syncEpics$,
	cryptoEpics$
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
