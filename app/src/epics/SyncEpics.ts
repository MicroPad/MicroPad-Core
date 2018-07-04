import { combineEpics } from 'redux-observable';
import { isAction } from '../util';
import { actions } from '../actions';
import {
	catchError,
	combineLatest,
	concatMap,
	debounceTime,
	filter,
	map,
	mergeMap,
	switchMap,
	tap
} from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { AssetList, ISyncedNotepad, SyncLoginRequest, SyncUser } from '../types/SyncTypes';
import { ASSET_STORAGE, SYNC_STORAGE } from '../index';
import { DifferenceEngine } from '../DifferenceEngine';
import { of } from 'rxjs/observable/of';
import { Dialog } from '../dialogs';
import { IStoreState, SYNC_NAME } from '../types';
import { AddToSyncAction, NotepadToSyncNotepadAction, SyncAction, UploadAssetAction } from '../types/ActionTypes';
import { empty } from 'rxjs/observable/empty';
import { parse } from 'date-fns';
import { INotepadStoreState } from '../types/NotepadTypes';
import { fromPromise } from 'rxjs/observable/fromPromise';
import * as Materialize from 'materialize-css/dist/js/materialize';
import { defer } from 'rxjs/observable/defer';
import { Observable } from 'rxjs/Observable';
import { Store } from 'redux';
import { FlatNotepad } from 'upad-parse/dist';
import * as stringify from 'json-stringify-safe';

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

	export const actWithSyncNotepad$ = (action$, store) =>
		action$.pipe(
			isAction(actions.actWithSyncNotepad),
			filter(() => !!(store as Store<IStoreState>).getState().sync.user),
			map((action: Action<NotepadToSyncNotepadAction>) => action.payload),
			switchMap((payload: NotepadToSyncNotepadAction) =>
				fromPromise(DifferenceEngine.SyncService.notepadToSyncedNotepad(payload.notepad)).pipe(
					map((syncedNotepad: ISyncedNotepad) => {
						return payload.action(syncedNotepad);
					})
				)
			)
		);

	export const sync$ = action$ =>
		action$.pipe(
			isAction(actions.sync),
			tap(() => Materialize.Toast.removeAll()),
			map((action: Action<SyncAction>) => action.payload),
			filter((syncAction: SyncAction) => !!syncAction && !!syncAction.syncId && !!syncAction.notepad),
			switchMap((syncAction: SyncAction) =>
				of(syncAction).pipe(
					combineLatest(
						DifferenceEngine.SyncService.getLastModified(syncAction.syncId)
							.pipe(catchError(() => empty()))
					)
				)
			),
			filter(([syncAction, lastModified]: [SyncAction, Date]) => !!syncAction && !!lastModified),
			map(([syncAction, lastModified]: [SyncAction, Date]) => {
				if (parse(syncAction.notepad.lastModified).getTime() < lastModified.getTime()) {
					// Local notepad is older than remote
					return actions.requestSyncDownload(syncAction.syncId);
				} else if (parse(syncAction.notepad.lastModified).getTime() > lastModified.getTime()) {
					// Local notepad is newer than remote
					return actions.syncUpload.started(syncAction);
				}

				return false;
			}),
			filter(Boolean)
		);

	export const requestDownload$ = action$ =>
		action$.pipe(
			isAction(actions.requestSyncDownload),
			tap((action: Action<string>) =>
				Materialize.toast(`A newer copy of your notepad is online <a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.syncDownload('${action.payload}');">DOWNLOAD</a>`)),
			filter(() => false)
		);

	export const download$ = (action$, store) =>
		action$.pipe(
			isAction(actions.syncDownload.started),
			map((action: Action<string>) => action.payload),
			switchMap((syncId: string) =>
				DifferenceEngine.SyncService.downloadNotepad(syncId).pipe(
					switchMap((remoteNotepad: ISyncedNotepad) => {
						let localNotepad = (((<IStoreState> store.getState()).notepads || <INotepadStoreState> {}).notepad || <INotepadStoreState> {}).item;
						if (!localNotepad) localNotepad = new FlatNotepad('');

						return fromPromise(DifferenceEngine.SyncService.notepadToSyncedNotepad(localNotepad.toNotepad())).pipe(
							switchMap((local: ISyncedNotepad) => {
								const diffAssets = Object.keys(remoteNotepad.assetHashList)
									.filter(uuid => local.assetHashList[uuid] !== remoteNotepad.assetHashList[uuid]);

								if (diffAssets.length === 0) return of(remoteNotepad);

								// Download the different assets
								return DifferenceEngine.SyncService.getAssetDownloadLinks(syncId, diffAssets).pipe(
									mergeMap((urlList: AssetList): Observable<any>[] => {
										const downloads$ = Object.keys(urlList)
											.map(uuid =>
												DifferenceEngine.downloadAsset(urlList[uuid]).pipe(
													switchMap((asset: Blob) => fromPromise(
														ASSET_STORAGE.setItem(uuid, asset)
													))
												)
											);

										if (downloads$.length > 0) return downloads$;
										return [of(remoteNotepad)];
									}),
									concatMap(assetDownloads => assetDownloads),
									catchError(err => {
										console.error(err);
										return of(remoteNotepad);
									}),
									map(() => {
										return { ...remoteNotepad, notepadAssets: Object.keys(remoteNotepad.assetHashList) };
									})
								);
							})
						);
					}),
					map((remoteNotepad: ISyncedNotepad) => actions.restoreJsonNotepad(stringify(remoteNotepad))),
					catchError((error): Observable<Action<any>> => {
						console.error(error);
						const message = (!!error.response) ? error.response : 'There was an error syncing';
						if (message === 'Invalid token') {
							Dialog.alert('Your token has expired. Please login again.');
							return of(actions.syncLogout(undefined));
						}

						Dialog.alert(message);

						return of(actions.syncDownload.failed({ params: '', error }));
					})
				)
			)
		);

	export const upload$ = (action$, store) =>
		action$.pipe(
			isAction(actions.syncUpload.started),
			map((action: Action<SyncAction>) => action.payload),
			map((payload: SyncAction) => [payload, (<IStoreState> store.getState()).sync.user]),
			filter(([payload, user]: [SyncAction, SyncUser]) => !!payload && !!user),
			switchMap(([payload, user]: [SyncAction, SyncUser]) =>
				DifferenceEngine.AccountService.isPro(user.username, user.token).pipe(
					tap((isPro: boolean) => {
						if (Object.keys(payload.notepad.assetHashList).length < 10 || isPro) return;
						throw 'too many assets';
					}),
					switchMap(() => DifferenceEngine.SyncService.uploadNotepad(payload.syncId, payload.notepad)),
					map((assetList: AssetList) => actions.syncUpload.done({ params: {} as SyncAction, result: assetList })),
					catchError((error): Observable<Action<any>> => {
						if (error === 'too many assets') {
							return of(actions.syncProError(undefined));
						}

						console.error(error);
						const message = (!!error.response) ? error.response.error : 'There was an error syncing';
						if (message === 'Invalid token') {
							Dialog.alert('Your token has expired. Please login again.');
							return of(actions.syncLogout(undefined));
						}

						Dialog.alert(message);
						return of(actions.syncUpload.failed({ params: {} as SyncAction, error }));
					})
				)
			)
		);

	export const uploadAssets$ = action$ =>
		action$.pipe(
			isAction(actions.syncUpload.done),
			map((action: Action<Success<SyncAction, AssetList>>) => action.payload.result),
			switchMap((assetList: AssetList) => fromPromise((async () => {
				const requests: UploadAssetAction[] = [];

				const blobs: Blob[] = await Promise.all(Object.keys(assetList).map(uuid => ASSET_STORAGE.getItem<Blob>(uuid)));
				Object.values(assetList).forEach((url, i) => requests.push({ url, asset: blobs[i] }));

				return requests;
			})())),
			mergeMap((requests: UploadAssetAction[]) => requests.map(req => actions.syncUploadAsset.started(req)))
		);

	export const uploadAsset$ = action$ =>
		action$.pipe(
			isAction(actions.syncUploadAsset.started),
			map((action: Action<UploadAssetAction>) => action.payload),
			concatMap((payload: UploadAssetAction) => defer(() => DifferenceEngine.uploadAsset(payload.url, payload.asset))),
			map(() => actions.syncUploadAsset.done({ params: {} as UploadAssetAction, result: undefined }))
		);

	export const syncAssetsAllDone$ = action$ =>
		action$.pipe(
			isAction(actions.syncUploadAsset.done, actions.syncUploadAsset.failed),
			debounceTime(1300),
			map(() => actions.syncAssetsAllDone(undefined))
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
						catchError((error): Observable<any> => {
							if (!!error.response && !!error.response.error) {
								const message: string = error.response.error;
								if (message === 'Invalid token') {
									Dialog.alert('Your sync token has expired. Please login again.');
									return of(actions.syncLogout(undefined));
								}
								Dialog.alert(message);
							}

							return of(actions.getSyncedNotepadList.failed({ params: user, error }));
						})
					)
			)
		);

	export const deleteNotepad$ = action$ =>
		action$.pipe(
			isAction(actions.deleteFromSync.started),
			switchMap((action: Action<string>) =>
				DifferenceEngine.SyncService.deleteNotepad(action.payload).pipe(
					map(() => actions.deleteFromSync.done({ params: '', result: undefined })),
					catchError(error => {
						console.error(error);
						if (!!error.response && !!error.response.error) Dialog.alert(error.response.error);
						return of(actions.deleteFromSync.failed({ params: '', error }));
					})
				)
			)
		);

	export const addNotepad$ = action$ =>
		action$.pipe(
			isAction(actions.addToSync.started),
			switchMap((action: Action<AddToSyncAction>) =>
				DifferenceEngine.NotepadService.create(action.payload.user.username, action.payload.user.token, action.payload.notepadTitle).pipe(
					map((syncId: string) => actions.addToSync.done({ params: <AddToSyncAction> {}, result: syncId })),
					catchError((error): Observable<Action<any>> => {
						console.error(error);
						if (!!error.response && !!error.response.error) {
							if (error.response.error === 'Invalid token') {
								Dialog.alert('Your token has expired. Please login again.');
								return of(actions.syncLogout(undefined));
							}

							Dialog.alert(error.response.error);
						}

						return of(actions.addToSync.failed({ params: <AddToSyncAction> {}, error }));
					})
				)
			)
		);

	export const syncOnAdded$ = (action$, store) =>
		action$.pipe(
			isAction(actions.addToSync.done),
			map(() => store.getState()),
			map((state: IStoreState) => state.notepads.notepad),
			filter(Boolean),
			filter((notepadState: INotepadStoreState) => !!notepadState.item && !!notepadState.activeSyncId),
			map((notepadState: INotepadStoreState) => actions.actWithSyncNotepad({
				notepad: notepadState.item!.toNotepad(),
				action: notepad => actions.sync({ notepad, syncId: notepadState.activeSyncId! })
			}))
		);

	export const refreshNotepadListOnAction$ = (action$, store) =>
		action$.pipe(
			isAction(actions.deleteFromSync.done),
			map(() => store.getState()),
			map((state: IStoreState) => state.sync.user),
			filter(Boolean),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const clearStorageOnLogout$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogout),
			switchMap(() => fromPromise(SYNC_STORAGE.removeItem('sync user'))),
			tap(() => Dialog.alert(`You have been logged out of ${SYNC_NAME}`)),
			filter(() => false)
		);

	export const openSyncProErrorModal$ = action$ =>
		action$.pipe(
			isAction(actions.syncProError),
			map(() => document.getElementById('sync-pro-error-trigger')),
			filter(Boolean),
			tap((trigger: HTMLAnchorElement) => trigger.click()),
			filter(() => false)
		);

	export const syncEpics$ = combineEpics(
		persistOnLogin$,
		login$,
		actWithSyncNotepad$,
		sync$,
		requestDownload$,
		download$,
		upload$,
		uploadAssets$,
		uploadAsset$,
		syncAssetsAllDone$,
		getNotepadListOnLogin$,
		getNotepadList$,
		getNotepadListOnNotepadLoad$,
		deleteNotepad$,
		addNotepad$,
		syncOnAdded$,
		refreshNotepadListOnAction$,
		clearStorageOnLogout$,
		openSyncProErrorModal$
	);
}
