import { combineEpics } from 'redux-observable';
import { notepadEpics$ } from '../../react-web/epics/NotepadEpics';
import { storageEpics$ } from '../../react-web/epics/StorageEpics';
import { HelpEpics } from '../../react-web/epics/HelpEpics';
import { SearchEpics } from './SearchEpics';
import { noteEpics$ } from '../../react-web/epics/NoteEpics';
import { ExplorerEpics } from './ExplorerEpics';
import { AppEpics } from '../../react-web/epics/AppEpics';
import { PrintEpics } from '../../react-web/epics/PrintEpics';
import { SyncEpics } from '../../react-web/epics/SyncEpics';
import { CryptoEpics } from '../../react-web/epics/CryptoEpics';

export const baseEpic$ = combineEpics(
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
