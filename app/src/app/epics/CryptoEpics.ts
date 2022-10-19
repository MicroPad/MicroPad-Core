import { combineEpics, ofType } from 'redux-observable';
import { EMPTY, from, Observable, of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { EpicDeps, EpicStore } from './index';
import { IStoreState } from '../types';
import { noEmit } from '../util';

export const encryptNotepad$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.encryptNotepad.type),
		withLatestFrom(state$),
		map(([action, state]) => actions.addCryptoPasskey({
			passkey: (action as MicroPadActions['encryptNotepad']).payload,
			notepadTitle: state.notepads.notepad?.item?.title,
			remember: false
		}))
	);

export const rememberPasskey$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.addCryptoPasskey.type),
		map(action => action as MicroPadActions['addCryptoPasskey']),
		filter(action => !!action.payload.notepadTitle && action.payload.remember),
		concatMap(action =>
			from(getStorage().cryptoPasskeysStorage.setItem(action.payload.notepadTitle!, action.payload.passkey)).pipe(
				catchError(err => {
					console.error(err);
					return EMPTY;
				})
			)
		),
		noEmit()
	);

export const forgetSavedPasswords$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.forgetSavedPasswords.started.type),
		switchMap(() => from(getStorage().cryptoPasskeysStorage.clear()).pipe(
			map(() => actions.forgetSavedPasswords.done({})),
			catchError(error => {
				console.error(error);
				return of(actions.forgetSavedPasswords.failed({ error }))
			})
		))
	);

export const cryptoEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	encryptNotepad$,
	rememberPasskey$,
	forgetSavedPasswords$
);
