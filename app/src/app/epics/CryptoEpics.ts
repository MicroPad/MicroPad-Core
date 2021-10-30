import { combineEpics, ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { actions, MicroPadAction } from '../actions';
import { Action } from 'redux-typescript-actions';
import { EpicStore } from './index';

export const encryptNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.encryptNotepad.type),
		map(action => actions.addCryptoPasskey({
			passkey: action.payload,
			notepadTitle: store.getState().notepads.notepad?.item?.title,
			remember: false
		}))
	);

export const cryptoEpics$ = combineEpics(
	encryptNotepad$
);
