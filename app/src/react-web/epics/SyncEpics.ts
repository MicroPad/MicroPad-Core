import { combineEpics, ofType } from 'redux-observable';
import { filterTruthy, isAction } from '../util';
import { actions } from '../../core/actions';
import {
	catchError,
	combineLatest,
	concatMap,
	distinctUntilKeyChanged,
	filter,
	first,
	map,
	mergeMap,
	switchMap, take,
	tap
} from 'rxjs/operators';
import { Action, Success } from 'redux-typescript-actions';
import { AssetList, ISyncedNotepad, SyncLoginRequest, SyncUser } from '../../core/types/SyncTypes';
import { ASSET_STORAGE, store as STORE, SYNC_STORAGE, TOAST_HANDLER } from '..';
import { DifferenceEngine } from '../DifferenceEngine';
import { Dialog } from '../dialogs';
import { IStoreState, SYNC_NAME } from '../../core/types';
import {
	AddToSyncAction,
	NotepadToSyncNotepadAction,
	SyncAction,
	UploadAssetAction
} from '../../core/types/ActionTypes';
import { BehaviorSubject, EMPTY, forkJoin, from, of } from 'rxjs';
import { parse } from 'date-fns';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import * as Materialize from 'materialize-css/dist/js/materialize';
import { Observable } from 'rxjs/Observable';
import { FlatNotepad } from 'upad-parse/dist';
import * as stringify from 'json-stringify-safe';

// TODO: Test this
export namespace SyncEpics {
	export const uploadCount$ = new BehaviorSubject<number>(0);

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

	export const actWithSyncNotepad$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			ofType<Action<NotepadToSyncNotepadAction>>(actions.actWithSyncNotepad.type),
			switchMap((action: Action<NotepadToSyncNotepadAction>) => state$.pipe(
				take(1),
				filter(state => !!state.sync.user),
				map(() => action.payload),
				switchMap(payload =>
					from(DifferenceEngine.SyncService.notepadToSyncedNotepad(payload.notepad)).pipe(
						map((syncedNotepad: ISyncedNotepad) => {
							return payload.action(syncedNotepad);
						})
					)
				)
			))
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
							.pipe(catchError(() => EMPTY))
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
			filterTruthy()
		);

	export const requestDownload$ = action$ =>
		action$.pipe(
			isAction(actions.requestSyncDownload),
			tap((action: Action<string>) => {
				const guid = TOAST_HANDLER.register(() => STORE.dispatch(actions.syncDownload.started(action.payload)));
				Materialize.toast(`A newer copy of your notepad is online <a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.toastEvent('${guid}');">DOWNLOAD</a>`);
			}),
			filter(() => false)
		);

	export const download$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.syncDownload.started),
			map((action: Action<string>) => action.payload),
			concatMap((syncId: string) =>
				DifferenceEngine.SyncService.downloadNotepad(syncId).pipe(
					switchMap((remoteNotepad: ISyncedNotepad) => state$.pipe(
						take(1),
						switchMap(state => {
							let localNotepad = ((state.notepads || <INotepadStoreState> {}).notepad || <INotepadStoreState> {}).item;
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
					)),
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

	export const upload$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.syncUpload.started),
			tap(() => uploadCount$.next(uploadCount$.getValue() + 1)),
			map((action: Action<SyncAction>) => action.payload),
			switchMap((payload: SyncAction) => state$.pipe(
				map(state => [payload, state.sync.user]),
				filter(([, user]: [SyncAction, SyncUser]) => !!payload && !!user),
				concatMap(([, user]: [SyncAction, SyncUser]) =>
					DifferenceEngine.AccountService.isPro(user.username, user.token).pipe(
						tap((isPro: boolean) => {
							if (Object.keys(payload.notepad.assetHashList).length < 10 || isPro) return;
							throw 'too many assets';
						}),
						switchMap(() => state$.pipe(
							take(1),
							concatMap(state =>
								DifferenceEngine.SyncService.uploadNotepad(
									user.username,
									user.token,
									payload.syncId,
									payload.notepad,
									state.notepadPasskeys[payload.notepad.title]
								)
									.pipe(
										concatMap((assetList: AssetList) => from((async () => {
											const requests: UploadAssetAction[] = [];

											const blobs: Blob[] = await Promise.all(Object.keys(assetList).map(uuid => ASSET_STORAGE.getItem<Blob>(uuid)));
											Object.values(assetList).forEach((url, i) => requests.push({ url, asset: blobs[i] }));

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
						)),
					)
				)
			))
		);

	export const getNotepadListOnLogin$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogin.done),
			map((action: Action<Success<SyncLoginRequest, SyncUser>>) => action.payload.result),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const getNotepadListOnNotepadLoad$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.parseNpx.done),
			switchMap(() => state$.pipe(take(1))),
			map((state:  IStoreState) => state.sync.user),
			filterTruthy(),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const getNotepadList$ = action$ =>
		action$.pipe(
			isAction(actions.getSyncedNotepadList.started),
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

	export const syncOnAdded$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.addToSync.done),
			switchMap(() => state$.pipe(take(1))),
			map((state: IStoreState) => state.notepads.notepad),
			filterTruthy(),
			filter((notepadState: INotepadStoreState) => !!notepadState.item && !!notepadState.activeSyncId),
			map((notepadState: INotepadStoreState) => actions.actWithSyncNotepad({
				notepad: notepadState.item!.toNotepad(),
				action: notepad => actions.sync({ notepad, syncId: notepadState.activeSyncId! })
			}))
		);

	export const refreshNotepadListOnAction$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.deleteFromSync.done),
			switchMap(() => state$.pipe(take(1))),
			map((state: IStoreState) => state.sync.user),
			filterTruthy(),
			map((user: SyncUser) => actions.getSyncedNotepadList.started(user))
		);

	export const clearStorageOnLogout$ = action$ =>
		action$.pipe(
			isAction(actions.syncLogout),
			switchMap(() => from(SYNC_STORAGE.removeItem('sync user'))),
			tap(() => Dialog.alert(`You have been logged out of ${SYNC_NAME}`)),
			filter(() => false)
		);

	export const openSyncProErrorModal$ = action$ =>
		action$.pipe(
			isAction(actions.syncProError),
			map(() => document.getElementById('sync-pro-error-trigger')),
			filterTruthy(),
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
