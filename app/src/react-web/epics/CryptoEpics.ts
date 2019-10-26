import { combineEpics } from 'redux-observable';
import { Action } from 'redux-typescript-actions';
import { elvis, isAction, resolveElvis } from '../util';
import { actions } from '../../core/actions';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AddCryptoPasskeyAction } from '../../core/types/ActionTypes';
import { IStoreState } from '../../core/types';

export namespace CryptoEpics {
	export const encryptNotepad$ = (action$: Observable<Action<string>>, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.encryptNotepad),
			switchMap(action => state$.pipe(
				take(1),
				map(state => ({
					passkey: action.payload,
					notepadTitle: resolveElvis(elvis(state.notepads).notepad.item.title)
				} as AddCryptoPasskeyAction)),
				map(payload => actions.addCryptoPasskey(payload))
			))
		);

	export const cryptoEpics$ = combineEpics(
		encryptNotepad$
	);
}
