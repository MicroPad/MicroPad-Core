// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { searchEpics$ } from './SearchEpics';
import { noteEpics$ } from './NoteEpics';
import { ExplorerEpics } from './ExplorerEpics';
import { MetaEpics } from './MetaEpics';
import { PrintEpics } from './PrintEpics';
import { SyncEpics } from './SyncEpics';
import { HelpEpics } from './HelpEpics';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	HelpEpics.helpEpics$,
	searchEpics$,
	noteEpics$,
	ExplorerEpics.explorerEpics$,
	MetaEpics.metaEpics$,
	PrintEpics.printEpics$,
	SyncEpics.syncEpics$
);

export const epicMiddleware = createEpicMiddleware(baseEpic$, {
	dependencies: {
		helpNpx
	}
});
