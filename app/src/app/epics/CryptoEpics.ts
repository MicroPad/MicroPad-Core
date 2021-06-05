import { combineEpics, ofType } from 'redux-observable';
import { elvis, resolveElvis } from '../util';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddCryptoPasskeyAction } from '../types/ActionTypes';
import { actions, MicroPadAction } from '../actions';
import { Action } from 'redux-typescript-actions';
import { EpicStore } from './index';

export const encryptNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.encryptNotepad.type),
		map(action => ({
			passkey: action.payload,
			notepadTitle: resolveElvis(elvis(store.getState().notepads).notepad.item.title)
		} as AddCryptoPasskeyAction)),
		map(payload => actions.addCryptoPasskey(payload))
	);

export const cryptoEpics$ = combineEpics(
	encryptNotepad$
);
