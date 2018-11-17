// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { noteEpics$ } from './NoteEpics';
import { ExplorerEpics } from './ExplorerEpics';
import { AppEpics } from './AppEpics';
import { PrintEpics } from './PrintEpics';
import { SyncEpics } from './SyncEpics';
import { HelpEpics } from './HelpEpics';
import { SearchEpics } from './SearchEpics';
import { getStorage } from '../index';
import { Action } from 'redux-typescript-actions';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	HelpEpics.helpEpics$,
	SearchEpics.searchEpics$,
	noteEpics$,
	ExplorerEpics.explorerEpics$,
	AppEpics.appEpics$,
	PrintEpics.printEpics$,
	SyncEpics.syncEpics$
);

export const epicMiddleware = createEpicMiddleware<Action<any>, any, {
	helpNpx: string,
	getStorage: () => { [name: string]: LocalForage }
}>(baseEpic$, {
	dependencies: {
		helpNpx,
		getStorage: getStorage
	}
});
