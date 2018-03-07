import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { helpEpics$ } from './HelpEpics';
import { searchEpics$ } from './SearchEpics';
import { noteEpics$ } from './NoteEpics';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$,
	helpEpics$,
	searchEpics$,
	noteEpics$
);

export const epicMiddleware = createEpicMiddleware(baseEpic$);
