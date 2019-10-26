import { Action, ActionCreator, isType } from 'redux-typescript-actions';
import { filter } from 'rxjs/operators';
import { SyntheticEvent } from 'react';
import * as QueryString from 'querystring';
import { FlatNotepad } from 'upad-parse/dist';
import { AppWindow } from '../core/types';

export const isAction = (...typesOfAction: ActionCreator<any>[]) =>
	filter((action: Action<any>) => typesOfAction.some(type => isType(action, type)));

export const filterTruthy = <T>() => filter((a: T | undefined | null): a is T => !!a);

export function isDev(): boolean {
	return (
		!QueryString.parse(location.search.slice(1)).prod
		&& (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
	);
}

export function isMobile(): boolean {
	return window.screen.width < 600;
}

export function readFileInputEventAsText(event: SyntheticEvent<HTMLInputElement>): Promise<string> {
	return new Promise(resolve => {
		const file = event.currentTarget.files![0];
		const reader = new FileReader();

		reader.onload = () => resolve(reader.result as string);

		reader.readAsText(file);
	});
}

export function fixFileName(filename: string) {
	return filename.replace(/[<>:;,?"*|\/\\]+/g, '_');
}

// Thanks to https://stackoverflow.com/a/105074
export function generateGuid(): string {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function getAsBase64(blob: Blob): Promise<string> {
	return new Promise<string>(resolve => {
		try {
			const reader = new FileReader();
			reader.onload = event => resolve((event.target as any).result);
			reader.readAsDataURL(blob);
		} catch (e) {
			console.warn(e);
			resolve('');
		}
	});
}

export function getUsedAssets(notepad: FlatNotepad): Set<string> {
	return new Set(
		Object.values(notepad.notes)
		.map(
			n => n.elements
				.map(e => e.args.ext!)
				.filter(ext => !!ext)
		)
		.reduce((used, cur) => used.concat(cur), [])
	);
}

/**
 * Safely travel through data that could be undefined
 */
export function elvis(obj: any): any {
	if (obj === undefined || obj === null) obj = { isUndefined: true };

	return new Proxy(typeof obj === 'object' ? { ...obj } : obj, {
		get: (target: object, key: PropertyKey): any => {
			// Thanks to https://www.beyondjava.net/elvis-operator-aka-safe-navigation-javascript-typescript
			const res = target[key];
			if (!!res) return res instanceof Object ? elvis(res) : res;

			return elvis(undefined);
		}
	});
}

export function resolveElvis(obj: any): any {
	return !!obj.isUndefined ? undefined : obj;
}

// Thanks to http://stackoverflow.com/a/12300351/998467
export function dataURItoBlob(dataURI: string) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	let byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// write the bytes of the string to an ArrayBuffer
	let ab = new ArrayBuffer(byteString.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	return new Blob([ab], { type: mimeString });
}

// Thanks to https://gist.github.com/nmsdvid/8807205
export function debounce(callback: (...args: any[]) => void, time: number) {
	let interval;
	return (...args) => {
		clearTimeout(interval);
		interval = setTimeout(() => {
			interval = null;
			callback(...args);
		}, time);
	};
}

export function isElection(): boolean {
	return ((window as unknown) as AppWindow).isElectron;
}

export function restoreObject<T>(objectToRestore: T, template: T): T {
	for (let o = template; o !== Object.prototype; o = Object.getPrototypeOf(o)) {
		for (let key of Object.getOwnPropertyNames(o)) {
			if (typeof template[key] === 'function') {
				objectToRestore[key] = template[key];
			}
		}
	}

	return objectToRestore;
}
