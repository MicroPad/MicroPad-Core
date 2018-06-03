import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import { catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { AssetList, ISyncedNotepad, SyncLoginRequest, SyncUser } from '../types/SyncTypes';
import { ASSET_STORAGE, SYNC_STORAGE } from '../index';
import { DifferenceEngine } from '../DifferenceEngine';
import { of } from 'rxjs/observable/of';
import { Dialog } from '../dialogs';
import { IStoreState, SYNC_NAME } from '../types';
import { ISyncAction } from '../types/ActionTypes';
import { empty } from 'rxjs/observable/empty';
import { parse } from 'date-fns';
import { INotepad, INotepadStoreState } from '../types/NotepadTypes';
import { fromPromise } from 'rxjs/observable/fromPromise';
import * as Parser from 'upad-parse/dist/index';

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
				DifferenceEngine.AccountService.login(req.username, req.password).pipe(
					tap(() => Dialog.alert(`Logged in successfully. Open your synced notepads using the notepads drop-down.`)),
					map(res =>
						actions.syncLogin.done({
							params: <SyncLoginRequest> {},
							result: { username: res.username, token: res.token }
						})
					),
					catchError(error => {
						const message = (!!error.response) ? error.response.error : 'There was an error logging in. Make sure your username/password is correct and that you\'re online.';
						Dialog.alert(message);
						return of(actions.syncLogin.failed({ params: <SyncLoginRequest> {}, error: error.response }));
					})
				)
			)
		);

	export const register$ = action$ =>
		action$.pipe(
			isAction(actions.syncRegister),
			map((action: Action<SyncLoginRequest>) => action.payload),
			switchMap((req: SyncLoginRequest) =>
				DifferenceEngine.AccountService.register(req.username, req.password).pipe(
					tap(() => Dialog.alert(`Logged in successfully. You can add a notepad to ${SYNC_NAME} using the side-bar.`)),
					map(res =>
						actions.syncLogin.done({
							params: <SyncLoginRequest> {},
							result: { username: res.username, token: res.token }
						})
					),
					catchError(error => {
						const message = (!!error.response) ? error.response : 'There was an error creating your account';
						Dialog.alert(message);
						return of(actions.syncLogin.failed({ params: <SyncLoginRequest> {}, error }));
					})
				)
			)
		);

	export const sync$ = action$ =>
		action$.pipe(
			isAction(actions.sync),
			map((action: Action<ISyncAction>) => action.payload),
			switchMap((syncAction: ISyncAction) =>
				of(syncAction).pipe(
					withLatestFrom(
						DifferenceEngine.SyncService.getLastModified(syncAction.syncId)
							.pipe(catchError(empty))
					)
				)
			),
			filter(([syncAction, lastModified]: [ISyncAction, Date]) => !!syncAction && !!lastModified),
			map(([syncAction, lastModified]: [ISyncAction, Date]) =>
				parse(syncAction.notepad.lastModified).getTime() < lastModified.getTime()
					? actions.syncDownload.started(syncAction.syncId) // Local notepad is older than remote
					: actions.syncUpload.started(syncAction) // Local notepad is newer than remote
			)
		);

	export const download$ = (action$, store) =>
		action$.pipe(
			isAction(actions.syncDownload.started),
			map((action: Action<string>) => action.payload),
			switchMap((syncId: string) =>
				DifferenceEngine.SyncService.downloadNotepad(syncId).pipe(
					switchMap((remoteNotepad: ISyncedNotepad) => {
						let localNotepad = (((<IStoreState> store).notepads || <INotepadStoreState> {}).notepad || <INotepadStoreState> {}).item;
						if (!localNotepad) localNotepad = <INotepad> Parser.createNotepad('');

						return fromPromise(DifferenceEngine.SyncService.notepadToSyncedNotepad(localNotepad)).pipe(
							switchMap((local: ISyncedNotepad) => {
								const diffAssets = Object.keys(remoteNotepad.assetHashList)
									.filter(uuid =>
										local.assetHashList[uuid] !== remoteNotepad.assetHashList[uuid]
									);

								// Download the different assets
								return DifferenceEngine.SyncService.getAssetDownloadLinks(syncId, diffAssets).pipe(
									mergeMap((urlList: AssetList) =>
										Object.keys(urlList)
											.map(uuid =>
												DifferenceEngine.downloadAsset(urlList[uuid]).pipe(
													switchMap((asset: Blob) => fromPromise(
														ASSET_STORAGE.setItem(uuid, asset)
													))
												)
											)
									),
									switchMap(assetDownloads => assetDownloads),
									catchError(err => {
										console.error(err);
										return of(remoteNotepad);
									}),
									map(() => remoteNotepad)
								);
							})
						);
					}),
					map((remoteNotepad: ISyncedNotepad) => actions.restoreJsonNotepad(JSON.stringify(remoteNotepad))),
					catchError(error => {
						console.error(error);
						const message = (!!error.response) ? error.response : 'There was an error syncing';
						Dialog.alert(message);
						return of(actions.syncDownload.failed({ params: '', error }));
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

	export const getNotepadListOnNotepadLoad$ = (action$, store) =>
		action$.pipe(
			isAction(actions.parseNpx.done),
			map(() => store.getState()),
			map((state:  IStoreState) => state.sync.user),
			filter(Boolean),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const getNotepadList$ = action$ =>
		action$.pipe(
			isAction(actions.getSyncedNotepadList.started),
			map((action: Action<SyncUser>) => action.payload),
			switchMap((user: SyncUser) =>
				DifferenceEngine.NotepadService.listNotepads(user.username, user.token)
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
		register$,
		sync$,
		download$,
		getNotepadListOnLogin$,
		getNotepadList$,
		getNotepadListOnNotepadLoad$
	);
}
