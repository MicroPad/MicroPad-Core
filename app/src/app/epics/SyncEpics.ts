import { combineEpics, ofType } from 'redux-observable';
import { filterTruthy, noEmit } from '../util';
import { actions, MicroPadAction } from '../actions';
import {
	catchError,
	combineLatest,
	concatMap,
	distinctUntilKeyChanged,
	filter,
	first,
	map,
	mergeMap,
	switchMap,
	tap
} from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { AssetList, ISyncedNotepad, SyncLoginRequest, SyncUser } from '../types/SyncTypes';
import { ASSET_STORAGE, store as STORE, SYNC_STORAGE } from '../root';
import * as DifferenceEngine from '../services/DifferenceEngine';
import { Dialog } from '../services/dialogs';
import { IStoreState, SYNC_NAME } from '../types';
import { AddToSyncAction, NotepadToSyncNotepadAction, SyncAction, UploadAssetAction } from '../types/ActionTypes';
import { BehaviorSubject, EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { parse } from 'date-fns';
import { INotepadStoreState } from '../types/NotepadTypes';
import { FlatNotepad, LAST_MODIFIED_FORMAT } from 'upad-parse/dist';
import stringify from 'json-stringify-safe';
import { EpicDeps, EpicStore } from './index';
import { Dispatch } from 'redux';

export const uploadCount$ = new BehaviorSubject<number>(0);

export const persistOnLogin$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<SyncLoginRequest, SyncUser>>>(actions.syncLogin.done.type),
		switchMap(action => SYNC_STORAGE.setItem('sync user', action.payload.result)),
		noEmit()
	);

export const login$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<SyncLoginRequest>>(actions.syncLogin.started.type),
		map((action: Action<SyncLoginRequest>) => action.payload),
		switchMap((req: SyncLoginRequest) =>
			DifferenceEngine.AccountService.login(req.username, req.password).pipe(
				tap(() => Dialog.alert(`Logged in successfully. Open your synced notepads using the notepads drop-down.`)),
				map(res =>
					actions.syncLogin.done({
						params: {} as SyncLoginRequest,
						result: { username: res.username, token: res.token }
					})
				),
				catchError(error => {
					const message = (!!error.response) ? error.response.error : 'There was an error logging in. Make sure your username/password is correct and that you\'re online.';
					Dialog.alert(message);
					return of(actions.syncLogin.failed({ params: {} as SyncLoginRequest, error: error.response }));
				})
			)
		)
	);

export const actWithSyncNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<NotepadToSyncNotepadAction>>(actions.actWithSyncNotepad.type),
		filter(() => !!store.getState().sync.user),
		map((action: Action<NotepadToSyncNotepadAction>) => action.payload),
		switchMap((payload: NotepadToSyncNotepadAction) =>
			from(DifferenceEngine.SyncService.notepadToSyncedNotepad(payload.notepad)).pipe(
				map((syncedNotepad: ISyncedNotepad) => {
					return payload.action(syncedNotepad);
				})
			)
		)
	);

export const sync$ = (action$: Observable<MicroPadAction>, _, { notificationService }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<SyncAction>>(actions.sync.type),
		tap(() => notificationService.dismissToasts()),
		map((action: Action<SyncAction>) => action.payload),
		filter((syncAction: SyncAction) => !!syncAction && !!syncAction.syncId && !!syncAction.notepad),
		switchMap((syncAction: SyncAction) =>
			of(syncAction).pipe(
				combineLatest(
					DifferenceEngine.SyncService.getLastModified(syncAction.syncId)
						.pipe(catchError(() => EMPTY))
				)
			)
		),
		filter(([syncAction, lastModified]: [SyncAction, Date]) => !!syncAction && !!lastModified),
		map(([syncAction, lastModified]: [SyncAction, Date]) => {
			if (parse(syncAction.notepad.lastModified, LAST_MODIFIED_FORMAT, new Date()).getTime() < lastModified.getTime()) {
				// Local notepad is older than remote
				return actions.requestSyncDownload(syncAction.syncId);
			} else if (parse(syncAction.notepad.lastModified, LAST_MODIFIED_FORMAT, new Date()).getTime() > lastModified.getTime()) {
				// Local notepad is newer than remote
				return actions.syncUpload.started(syncAction);
			}

			return false;
		}),
		filterTruthy()
	);

export const requestDownload$ = (action$: Observable<MicroPadAction>, _, { getToastEventHandler, notificationService }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.requestSyncDownload.type),
		tap((action: Action<string>) => {
			const guid = getToastEventHandler().register(() => STORE.dispatch(actions.syncDownload.started(action.payload)));
			notificationService.toast({ html: `A newer copy of your notepad is online <a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.toastEvent('${guid}');">DOWNLOAD</a>` });
		}),
		noEmit()
	);

export const download$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.syncDownload.started.type),
		map((action: Action<string>) => action.payload),
		concatMap((syncId: string) =>
			DifferenceEngine.SyncService.downloadNotepad(syncId).pipe(
				switchMap((remoteNotepad: ISyncedNotepad) => {
					let localNotepad = (((store.getState() as IStoreState).notepads ||{} as INotepadStoreState).notepad ||{} as INotepadStoreState).item;
					if (!localNotepad) localNotepad = new FlatNotepad('');

					return from(DifferenceEngine.SyncService.notepadToSyncedNotepad(localNotepad.toNotepad())).pipe(
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
												switchMap((asset: Blob) => from(
													ASSET_STORAGE.setItem(uuid, asset)
												))
											)
										);

									if (downloads$.length > 0) return forkJoin(downloads$) as any;
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
				// @ts-ignore TODO
				distinctUntilKeyChanged('lastModified'),
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

export const upload$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<SyncAction>>(actions.syncUpload.started.type),
		tap(() => uploadCount$.next(uploadCount$.getValue() + 1)),
		map((action): [SyncAction, SyncUser] => [action.payload, store.getState().sync.user!]),
		filter(([payload, user]: [SyncAction, SyncUser]) => !!payload && !!user),
		concatMap(([payload, user]: [SyncAction, SyncUser]) =>
			DifferenceEngine.AccountService.isPro(user.username, user.token).pipe(
				tap((isPro: boolean) => {
					if (Object.keys(payload.notepad.assetHashList).length < 10 || isPro) return;
					throw new Error('too many assets');
				}),
				concatMap(() =>
					DifferenceEngine.SyncService.uploadNotepad(
						user.username,
						user.token,
						payload.syncId,
						payload.notepad,
						store.getState().notepadPasskeys[payload.notepad.title]
					)
						.pipe(
							concatMap((assetList: AssetList) => from((async () => {
								const requests: UploadAssetAction[] = [];

								const blobs: Array<Blob | null> = await Promise.all(Object.keys(assetList).map(uuid => ASSET_STORAGE.getItem<Blob>(uuid)));
								Object.values(assetList)
									.filter((url, i) => {
										if (!blobs[i]) {
											console.error('Asset was null, skipping ', url);
											return false;
										}
										return true;
									})
									.forEach((url, i) => requests.push({ url, asset: blobs[i]! }));

								return requests;
							})())),
							concatMap((requests: UploadAssetAction[]) => from((async () =>
									await Promise.all(requests.map(req => DifferenceEngine.uploadAsset(req.url, req.asset).toPromise()))
							)()))
						)
				),
				switchMap(() =>
					uploadCount$.pipe(
						first(),
						map(n => n - 1),
						tap(n => uploadCount$.next(n)),
						filter(n => n === 0),
						map(() => actions.syncUpload.done({ params: {} as SyncAction, result: undefined }))
					)
				),
				catchError((error): Observable<Action<any>> => {
					uploadCount$.next(0);

					if (error && error.message === 'too many assets') {
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

export const getNotepadListOnLogin$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<Success<SyncLoginRequest, SyncUser>>>(actions.syncLogin.done.type),
		map((action: Action<Success<SyncLoginRequest, SyncUser>>) => action.payload.result),
		map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
	);

export const getNotepadListOnNotepadLoad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.parseNpx.done.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.sync.user),
		filterTruthy(),
		map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
	);

export const getNotepadList$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<SyncUser>>(actions.getSyncedNotepadList.started.type),
		map((action: Action<SyncUser>) => action.payload),
		switchMap((user: SyncUser) =>
			DifferenceEngine.NotepadService.listSharedNotepads(user.username, user.token)
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

export const deleteNotepad$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.deleteFromSync.started.type),
		map(action => ({ action, user: store.getState().sync.user })),
		filter(({ user }) => !!user),
		switchMap(({ action, user }) =>
			DifferenceEngine.SyncService.deleteNotepad(action.payload, user!.username, user!.token).pipe(
				map(() => actions.deleteFromSync.done({ params: '', result: undefined })),
				catchError(error => {
					console.error(error);
					if (!!error.response && !!error.response.error) Dialog.alert(error.response.error);
					return of(actions.deleteFromSync.failed({ params: '', error }));
				})
			)
		)
	);

export const addNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<AddToSyncAction>>(actions.addToSync.started.type),
		switchMap((action: Action<AddToSyncAction>) =>
			DifferenceEngine.NotepadService.create(action.payload.user.username, action.payload.user.token, action.payload.notepadTitle).pipe(
				map((syncId: string) => actions.addToSync.done({ params: {} as AddToSyncAction, result: syncId })),
				catchError((error): Observable<Action<any>> => {
					console.error(error);
					if (!!error.response && !!error.response.error) {
						if (error.response.error === 'Invalid token') {
							Dialog.alert('Your token has expired. Please login again.');
							return of(actions.syncLogout(undefined));
						}

						Dialog.alert(error.response.error);
					}

					return of(actions.addToSync.failed({ params: {} as AddToSyncAction, error }));
				})
			)
		)
	);

export const syncOnAdded$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.addToSync.done.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads.notepad),
		filterTruthy(),
		filter((notepadState: INotepadStoreState) => !!notepadState.item && !!notepadState.activeSyncId),
		map((notepadState: INotepadStoreState) => actions.actWithSyncNotepad({
			notepad: notepadState.item!.toNotepad(),
			action: notepad => actions.sync({ notepad, syncId: notepadState.activeSyncId! })
		}))
	);

export const refreshNotepadListOnAction$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.deleteFromSync.done.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.sync.user),
		filterTruthy(),
		map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
	);

export const clearStorageOnLogout$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.syncLogout.type),
		switchMap(() => from(SYNC_STORAGE.removeItem('sync user'))),
		tap(() => Dialog.alert(`You have been logged out of ${SYNC_NAME}`)),
		noEmit()
	);

export const openSyncProErrorModal$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.syncProError.type),
		map(() => document.getElementById('sync-pro-error-modal')),
		filterTruthy(),
		tap(modalEl => M.Modal.getInstance(modalEl).open()),
		noEmit()
	);

export const syncEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	persistOnLogin$,
	login$,
	actWithSyncNotepad$,
	sync$,
	requestDownload$,
	download$,
	upload$,
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
