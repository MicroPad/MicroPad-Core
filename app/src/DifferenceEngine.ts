import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { MICROPAD_URL } from './types';
import { map, retry } from 'rxjs/operators';
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable';
import { SyncedNotepadList } from './types/SyncTypes';
import { isDev } from './util';
import { parse } from 'date-fns';

export namespace DifferenceEngine {
	export namespace AccountService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('account', endpoint, resource, payload);

		export const login = (username: string, password: string): Observable<{ username: string, token: string }> => {
			return call<{ token: string }>('login', username, { password })
				.pipe(map(res => { return { username, token: res.token }; }));
		};

		export const register = (username: string, password: string): Observable<{ username: string, token: string }> => {
			return call<{ token: string }>('create', username, { password })
				.pipe(map(res => { return { username, token: res.token }; }));
		};
	}

	export namespace NotepadService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('notepad', endpoint, resource, payload);

		export const listNotepads = (username: string, token: string): Observable<SyncedNotepadList> =>
			call<{ notepads: SyncedNotepadList }>('list_notepads', username, { token }).pipe(map(res => res.notepads));
	}

	export namespace SyncService {
		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('sync', endpoint, resource, payload);

		export const getLastModified = (syncId: string): Observable<Date> =>
			call<{ title: string, lastModified: string }>('info', syncId).pipe(map(res => parse(res.lastModified)));
	}

	function callApi<T>(parent: string, endpoint: string, resource: string, payload?: object, method?: string): Observable<T> {
		return ajax({
			url: `${isDev() ? 'http://localhost:48025' : MICROPAD_URL}/diffeng/${parent}/${endpoint}/${resource}`,
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
}
