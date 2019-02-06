import { combineEpics } from 'redux-observable';
import { Action, Failure } from 'redux-typescript-actions';
import { isAction } from '../util';
import { actions } from '../../core/actions';
import { from, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { encrypt } from 'upad-parse/dist/crypto';
import { EncryptNotepadAction } from '../../core/types/ActionTypes';
import { Dialog } from '../dialogs';

export namespace CryptoEpics {
	export const encryptNotepad$ = (action$: Observable<Action<EncryptNotepadAction>>) =>
		action$.pipe(
			isAction(actions.encryptNotepad.started),
			map(action => action.payload),
			map((payload: EncryptNotepadAction) => ({
				...payload,
				notepad: payload.notepad.clone({ crypto: 'AES-256' })
			})),
			switchMap((payload: EncryptNotepadAction) =>
				from(encrypt(payload.notepad, payload.passkey)).pipe(
					map(encryptedNotepad => actions.encryptNotepad.done({
						params: payload,
						result: encryptedNotepad
					})),
					catchError(error => of(actions.encryptNotepad.failed({
						params: payload,
						error
					})))
				)
			)
		);

	export const encryptError$ = action$ =>
		action$.pipe(
			isAction(actions.encryptNotepad.failed),
			map((action: Action<Failure<EncryptNotepadAction, Error>>) => action.payload.error),
			tap((error: Error) => Dialog.alert(`Error: ${error.message}`)),
			filter(() => false)
		);

	export const cryptoEpics$ = combineEpics(
		encryptNotepad$,
		encryptError$
	);
}
