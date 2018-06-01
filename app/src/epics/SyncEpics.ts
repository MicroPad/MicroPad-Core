import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
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
						map(res =>
							actions.syncLogin.done({
								params: <SyncLoginRequest> {},
								result: { username: res.username, token: res.token }
							})
						),
						catchError(error => {
							Dialog.alert(error);
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

	export const getNoteapadList$ = action$ =>
		action$.pipe(
			isAction(actions.getSyncedNotepadList.started),
			map((action: Action<SyncUser>) => action.payload),
			switchMap((user: SyncUser) =>
				SyncService.NotepadService.listNotepads(user.username, user.token)
					.pipe(
						map(res => actions.getSyncedNotepadList.done({ params: user, result: res })),
						catchError(() => of(actions.syncLogout(undefined)))
					)
			)
		);

	export const syncEpics$ = combineEpics(
		persistOnLogin$,
		login$,
		getNotepadListOnLogin$,
		getNoteapadList$
	);
}
