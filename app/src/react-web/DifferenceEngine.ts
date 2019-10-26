// @ts-ignore
import SyncWorker from '!workerize-loader!./SyncWorker.js';

import { from, Observable, of } from 'rxjs';
import { MICROPAD_URL } from '../core/types';
import { concatMap, map, retry } from 'rxjs/operators';
import {
	AssetList,
	INotepadSharingData,
	ISyncedNotepad,
	ISyncWorker,
	SyncedNotepadList
} from '../core/types/SyncTypes';
import { parse } from 'date-fns';
import * as QueryString from 'querystring';
import { Notepad } from 'upad-parse/dist';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { encrypt } from 'upad-parse/dist/crypto';

export namespace DifferenceEngine {
	const SyncThread = new SyncWorker() as ISyncWorker;

	export namespace AccountService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('account', endpoint, resource, payload);

		export const login = (username: string, password: string): Observable<{ username: string, token: string }> => {
			return call<{ token: string }>('login', username, { password })
				.pipe(map(res => { return { username, token: res.token }; }));
		};

		export const isPro = (username: string, token: string): Observable<boolean> => {
			return call<{ isPro: boolean }>('is_pro', username, { token })
				.pipe(map(res => res.isPro));
		};
	}

	export namespace NotepadService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('notepad', endpoint, resource, payload);

		/** @deprecated */
		export const listNotepads = (username: string, token: string): Observable<SyncedNotepadList> =>
			call<{ notepads: SyncedNotepadList }>('list_notepads', username, { token }).pipe(map(res => res.notepads));

		export const listSharedNotepads = (username: string, token: string): Observable<Record<string, INotepadSharingData>> =>
			call<{ notepads: Record<string, INotepadSharingData> }>('sharing_list_notepads', username, { token }).pipe(map(res => res.notepads));

		export const create = (username: string, token: string, notepadTitle: string): Observable<string> => {
			return call<{ notepad: string }>('create', username, { token, notepadTitle }).pipe(map(res => res.notepad));
		};
	}

	export namespace SyncService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('sync', endpoint, resource, payload);

		export const getLastModified = (syncId: string): Observable<Date> =>
			call<{ title: string, lastModified: string }>('info', syncId).pipe(map(res => parse(res.lastModified)));

		export const downloadNotepad = (syncId: string): Observable<ISyncedNotepad> =>
			call<{ notepad: string }>('download', syncId).pipe(map(res => JSON.parse(res.notepad)));

		export const getAssetDownloadLinks = (syncId: string, assets: string[]): Observable<AssetList> =>
			call<{ urlList: AssetList }>('download_assets', syncId, { assets: JSON.stringify(assets) }).pipe(map(res => res.urlList));

		export const uploadNotepad = (username: string, token: string, syncId: string, notepad: ISyncedNotepad, passkey?: string): Observable<AssetList> =>
			from(!!notepad.crypto && !!passkey ? encrypt(notepad, passkey) : of(notepad)).pipe(
				concatMap(np =>
					call<{ assetsToUpload: AssetList }>('upload', syncId, {
						notepadV2: JSON.stringify(np, (k, v) => (k === 'parent') ? undefined : v) // Remove parent links here, unneeded content
							.replace(
								/[\u007f-\uffff]/g,
								char => '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4)
							), // Fix unicode encoding
						username,
						token
					})
				),
				map(res => res.assetsToUpload)
			);

		export const deleteNotepad = (syncId: string): Observable<void> => call<void>('delete', syncId);

		export function notepadToSyncedNotepad(notepad: Notepad): Promise<ISyncedNotepad> {
			return SyncThread.toSyncedNotepad(notepad);
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
			responseType: 'json',
			timeout: !!payload ? undefined : 10000 // 10 seconds
		}).pipe(
			map((res: AjaxResponse) => res.response),
			retry(2)
		);
	}

	function devServer(): boolean {
		return !!QueryString.parse(location.search.slice(1)).local;
	}
}
