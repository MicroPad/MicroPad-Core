import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import { MICROPAD_URL } from './types';
import { map, retry } from 'rxjs/operators';
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable';
import { SyncedNotepadList } from './types/SyncTypes';

export namespace SyncService {
	export namespace AccountService {
		export const login = (username: string, password: string): Observable<{ username: string, token: string }> => {
			return call<{ token: string }>('login', username, { password })
				.pipe(map(res => { return { username, token: res.token }; }));
		};

		export const register = (username: string, password: string): Observable<{ username: string, token: string }> => {
			return call<{ token: string }>('create', username, { password })
				.pipe(map(res => { return { username, token: res.token }; }));
		};

		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('account', endpoint, resource, payload);
	}

	export namespace NotepadService {
		export const listNotepads = (username: string, token: string): Observable<SyncedNotepadList> =>
			call<SyncedNotepadList>('list_notepads', username, { token });

		const call = <T>(endpoint: string, resource: string, payload?: object) => callApi<T>('notepad', endpoint, resource, payload);
	}

	function callApi<T>(parent: string, endpoint: string, resource: string, payload?: object, method?: string): Observable<T> {
		return ajax({
			url: `${MICROPAD_URL}/diffeng/${parent}/${endpoint}/${resource}`,
			method: method || (!payload) ? 'GET' : 'POST',
			body: payload,
			crossDomain: true,
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			},
			responseType: 'json'
		}).pipe(
			map((res: AjaxResponse) => res.response),
			retry(2)
		);
	}
}
