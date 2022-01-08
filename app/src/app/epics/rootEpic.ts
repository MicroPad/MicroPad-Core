import { combineEpics } from 'redux-observable';
import { notepadEpics$ } from './NotepadEpics';
import { storageEpics$ } from './StorageEpics';
import { helpEpics$ } from './HelpEpics';
import { searchEpics$ } from './SearchEpics';
import { noteEpics$ } from './NoteEpics';
import { explorerEpics$ } from './ExplorerEpics';
import { appEpics$ } from './AppEpics';
import { printEpics$ } from './PrintEpics';
import { syncEpics$ } from './SyncEpics';
import { cryptoEpics$ } from './CryptoEpics';
import { dueDatesEpics$ } from './DueDatesEpics';
import { feelingLuckyEpics$ } from './FeelingLuckyEpics';
import { editorEpics$ } from './EditorEpics';
import { catchError } from 'rxjs/operators';

export const rootEpic$ = (action$, store$, deps) =>
	combineEpics(
		// notepadEpics$,
		// storageEpics$,
		// helpEpics$,
		// searchEpics$,
		// noteEpics$,
		// explorerEpics$,
		// appEpics$,
		// printEpics$,
		// syncEpics$,
		// cryptoEpics$,
		// dueDatesEpics$,
		feelingLuckyEpics$,
		// editorEpics$
	)(action$, store$, deps).pipe(
		catchError((error, source$) => {
			console.error('Uncaught in epic:', error);
			return source$;
		})
	);
