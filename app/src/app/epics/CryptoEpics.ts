import { combineEpics, ofType } from 'redux-observable';
import { EMPTY, from, Observable } from 'rxjs';
import { catchError, concatMap, filter, map } from 'rxjs/operators';
import { actions, MicroPadAction } from '../actions';
import { Action } from 'redux-typescript-actions';
import { EpicDeps, EpicStore } from './index';
import { AddCryptoPasskeyAction } from '../types/ActionTypes';
import { Dispatch } from 'redux';

export const encryptNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.encryptNotepad.type),
		map(action => actions.addCryptoPasskey({
			passkey: action.payload,
			notepadTitle: store.getState().notepads.notepad?.item?.title,
			remember: false
		}))
	);

export const rememberPasskey$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<AddCryptoPasskeyAction>>(actions.addCryptoPasskey.type),
		filter(action => action.payload.remember && !!action.payload.notepadTitle),
		concatMap((action: Action<AddCryptoPasskeyAction>) =>
			from(getStorage().cryptoPasskeysStorage.setItem(action.payload.notepadTitle!, action.payload.passkey)).pipe(
				map(() => action), // just keep the types happy
				catchError(err => {
					console.error(err);
					return EMPTY;
				})
			)
		),
		filter(() => false)
	);

export const cryptoEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	encryptNotepad$,
	rememberPasskey$
);
