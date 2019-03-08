import { combineEpics } from 'redux-observable';
import { Action } from 'redux-typescript-actions';
import { elvis, isAction, resolveElvis } from '../util';
import { actions } from '../../core/actions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddCryptoPasskeyAction } from '../../core/types/ActionTypes';
import { IStoreState } from '../../core/types';
import { Store } from 'redux';

export namespace CryptoEpics {
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
}
