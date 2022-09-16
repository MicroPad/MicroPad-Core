import { combineEpics, ofType } from 'redux-observable';
import { EMPTY, from, Observable } from 'rxjs';
import { catchError, concatMap, filter, map, withLatestFrom } from 'rxjs/operators';
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

export const cryptoEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	encryptNotepad$,
	rememberPasskey$
);
