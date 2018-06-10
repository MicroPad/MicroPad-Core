// @ts-ignore
import SyncWorker from '!workerize-loader!./SyncWorker.js';

import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { MICROPAD_URL } from './types';
import { map, retry } from 'rxjs/operators';
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable';
import { AssetList, ISyncedNotepad, ISyncWorker, SyncedNotepadList } from './types/SyncTypes';
import { parse } from 'date-fns';
import { INotepad } from './types/NotepadTypes';
import * as stringify from 'json-stringify-safe';
import { Base64 } from 'js-base64';
import * as QueryString from 'querystring';

export namespace DifferenceEngine {
	const SyncThread = new SyncWorker() as ISyncWorker;

	export namespace AccountService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('account', endpoint, resource, payload);

		export const login = (username: string, password: string): Observable<{ username: string, token: string }> => {
			// TODO: Remove this and send the object natively when https://github.com/ReactiveX/rxjs/issues/3824 is fixed
			const data = new URLSearchParams();
			data.append('password', password);

			return call<{ token: string }>('login', username, data.toString() as any)
				.pipe(map(res => { return { username, token: res.token }; }));
		};

		export const isPro = (username: string, token: string): Observable<boolean> => {
			return call<{ isPro: boolean }>('is_pro', username, { token })
				.pipe(map(res => res.isPro));
		};
	}

	export namespace NotepadService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('notepad', endpoint, resource, payload);

		export const listNotepads = (username: string, token: string): Observable<SyncedNotepadList> =>
			call<{ notepads: SyncedNotepadList }>('list_notepads', username, { token }).pipe(map(res => res.notepads));

		export const create = (username: string, token: string): Observable<string> =>
			call<{ notepad: string }>('create', username, { token }).pipe(map(res => res.notepad));
	}

	export namespace SyncService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('sync', endpoint, resource, payload);

		export const getLastModified = (syncId: string): Observable<Date> =>
			call<{ title: string, lastModified: string }>('info', syncId).pipe(map(res => parse(res.lastModified)));

		export const downloadNotepad = (syncId: string): Observable<ISyncedNotepad> =>
			call<{ notepad: string }>('download', syncId).pipe(map(res => JSON.parse(res.notepad)));

		export const getAssetDownloadLinks = (syncId: string, assets: string[]): Observable<AssetList> =>
			call<{ urlList: AssetList }>('download_assets', syncId, { assets: JSON.stringify(assets) }).pipe(map(res => res.urlList));

		export const uploadNotepad = (syncId: string, notepad: ISyncedNotepad): Observable<AssetList> =>
			call<{ assetsToUpload: AssetList }>('upload', syncId, { notepad: encodeURIComponent(stringify(notepad)) }).pipe(map(res => res.assetsToUpload));

		export const deleteNotepad = (syncId: string): Observable<void> => call<void>('delete', syncId);

		export async function notepadToSyncedNotepad(notepad: INotepad): Promise<ISyncedNotepad> {
			return await SyncThread.toSyncedNotepad(notepad);
		}
	}

	export function downloadAsset(url: string): Observable<Blob> {
		return ajax({
			url,
			method: 'GET',
			crossDomain: true,
			responseType: 'blob'
		}).pipe(
			map((res: AjaxResponse) => res.response),
			retry(2)
		);
	}

	export function uploadAsset(url: string, asset: Blob): Observable<void> {
		return ajax({
			url,
			method: 'PUT',
			body: asset,
			crossDomain: true,
			headers: {
				'Content-Type': 'application/octet-stream'
			}
		}).pipe(
			map(() => undefined),
			retry(2)
		);
	}

	function callApi<T>(parent: string, endpoint: string, resource: string, payload?: object, method?: string): Observable<T> {
		return ajax({
			url: `${devServer() ? 'http://localhost:48025' : MICROPAD_URL}/diffeng/${parent}/${endpoint}/${resource}`,
			method: method || (!payload) ? 'GET' : 'POST',
			body: payload,
			crossDomain: true,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			responseType: 'json'
		}).pipe(
			map((res: AjaxResponse) => res.response),
			retry(2)
		);
	}

	function devServer(): boolean {
		return !!QueryString.parse(location.search.slice(1)).local;
	}
}
