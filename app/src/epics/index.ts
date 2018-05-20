import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { helpEpics$ } from './HelpEpics';
import { searchEpics$ } from './SearchEpics';
import { noteEpics$ } from './NoteEpics';
import { ExplorerEpics } from './ExplorerEpics';
import { MetaEpics } from './MetaEpics';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	helpEpics$,
	searchEpics$,
	noteEpics$,
	ExplorerEpics.explorerEpics$,
	MetaEpics.metaEpics$
);

export const epicMiddleware = createEpicMiddleware(baseEpic$);
