import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';

const baseEpic$ = combineEpics(
	notepadEpics$,
	storageEpics$
);

export const epicMiddleware = createEpicMiddleware(baseEpic$);
