import { combineEpics } from 'redux-observable';
import { Action } from 'redux-typescript-actions';
import { elvis, isAction, resolveElvis } from '../util';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddCryptoPasskeyAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { Store } from 'redux';
import { actions } from '../actions';

export const encryptNotepad$ = (action$: Observable<Action<string>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.encryptNotepad),
		map(action => ({
			passkey: action.payload,
			notepadTitle: resolveElvis(elvis(store.getState().notepads).notepad.item.title)
		} as AddCryptoPasskeyAction)),
		map(payload => actions.addCryptoPasskey(payload))
	);

export const cryptoEpics$ = combineEpics(
	encryptNotepad$
);
