// @ts-expect-error
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '../assets/Help.npx';

import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { noteEpics$ } from './NoteEpics';
import { appEpics$ } from './AppEpics';
import { Action } from 'typescript-fsa';
import { cryptoEpics$ } from './CryptoEpics';
import { getStorage, StorageMap, TOAST_HANDLER } from '../root';
import { printEpics$ } from './PrintEpics';
import { helpEpics$ } from './HelpEpics';
import { searchEpics$ } from './SearchEpics';
import { syncEpics$ } from './SyncEpics';
import { explorerEpics$ } from './ExplorerEpics';
import { dueDatesEpics$ } from './DueDatesEpics';
import { Dispatch, MiddlewareAPI } from 'redux';
import { IStoreState } from '../types';
import ToastEventHandler from '../services/ToastEventHandler';
import { NotificationService } from '../services/NotificationService';
import { feelingLuckyEpics$ } from './FeelingLuckyEpics';
import { editorEpics$ } from './EditorEpics';

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
	cryptoEpics$,
	dueDatesEpics$,
	feelingLuckyEpics$,
	editorEpics$
);

export type EpicDeps = {
	helpNpx: string,
	getStorage: () => StorageMap,
	now: () => Date,
	getToastEventHandler: () => ToastEventHandler,
	notificationService: NotificationService
};

export const epicMiddleware = createEpicMiddleware<Action<any>, any, EpicDeps>(baseEpic$, {
	dependencies: {
		helpNpx,
		getStorage: getStorage,
		now: () => new Date(),
		getToastEventHandler: () => TOAST_HANDLER,
		notificationService: new NotificationService()
	}
});

export type EpicStore = MiddlewareAPI<Dispatch, IStoreState>
