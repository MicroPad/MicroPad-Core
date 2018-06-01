import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { SyncLoginRequest, SyncUser } from '../types/SyncTypes';
import { SYNC_STORAGE } from '../index';
import { SyncService } from '../SyncService';
import { of } from 'rxjs/observable/of';
import { Dialog } from '../dialogs';

export namespace SyncEpics {
	export const persistOnLogin$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogin.done),
			switchMap((action: Action<Success<SyncLoginRequest, SyncUser>>) =>
				SYNC_STORAGE.setItem('sync user', action.payload.result)
			),
			filter(() => false)
		);

	export const login$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogin.started),
			map((action: Action<SyncLoginRequest>) => action.payload),
			switchMap((req: SyncLoginRequest) =>
				SyncService.AccountService.login(req.username, req.password)
					.pipe(
						tap(() => Dialog.alert(`Logged in successfully. Open your synced notepads using the notepads drop-down.`)),
						map(res =>
							actions.syncLogin.done({
								params: <SyncLoginRequest> {},
								result: { username: res.username, token: res.token }
							})
						),
						catchError(error => {
							const message = (!!error.response) ? error.response : 'There was an error logging in. Make sure your username/password is correct and that you\'re online.';
							Dialog.alert(message);
							return of(actions.syncLogin.failed({ params: <SyncLoginRequest> {}, error }));
						})
					)
			)
		);

	export const getNotepadListOnLogin$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogin.done),
			map((action: Action<Success<SyncLoginRequest, SyncUser>>) => action.payload.result),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const getNotepadList$ = action$ =>
		action$.pipe(
			isAction(actions.getSyncedNotepadList.started),
			map((action: Action<SyncUser>) => action.payload),
			switchMap((user: SyncUser) =>
				SyncService.NotepadService.listNotepads(user.username, user.token)
					.pipe(
						map(res => actions.getSyncedNotepadList.done({ params: user, result: res })),
						// TODO: Handle offline state (or token expiration) here
						catchError(error => of(actions.getSyncedNotepadList.failed({ params: user, error })))
					)
			)
		);

	export const syncEpics$ = combineEpics(
		persistOnLogin$,
		login$,
		getNotepadListOnLogin$,
		getNotepadList$
	);
}
