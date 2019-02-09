import { Action, ActionCreator, isType } from 'redux-typescript-actions';
import { filter } from 'rxjs/operators';
import { SyntheticEvent } from 'react';
import * as QueryString from 'querystring';
import { FlatNotepad, Notepad, Translators } from 'upad-parse/dist';
import { fromShell } from './CryptoService';
import { IStoreState } from '../core/types';
import { Store } from 'redux';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { EncryptNotepadAction } from '../core/types/ActionTypes';
import { actions } from '../core/actions';

export const isAction = (...typesOfAction: ActionCreator<any>[]) =>
	filter((action: Action<any>) => typesOfAction.some(type => isType(action, type)));

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

/**
 * Clean up all the assets that aren't in any notepads yet
 */
export async function cleanHangingAssets(notepadStorage: LocalForage, assetStorage: LocalForage, store: Store<IStoreState>): Promise<void> {
	const notepads: Promise<EncryptNotepadAction>[] = [];
	await notepadStorage.iterate((json: string) => {
		const shell: NotepadShell = JSON.parse(json);
		notepads.push(fromShell(shell, store.getState().notepadPasskeys[shell.title]));

		return;
	});

	const allUsedAssets: Set<string> = new Set<string>();
	const resolvedNotepads = (await Promise.all(
		notepads
			.map(p => p.catch(err => err))
	)).filter(res => !(res instanceof Error)).map((cryptoInfo: EncryptNotepadAction) => {
		store.dispatch(actions.addCryptoPasskey({ notepadTitle: cryptoInfo.notepad.title, passkey: cryptoInfo.passkey }));
		return cryptoInfo.notepad;
	});

	// Handle deletion of unused assets, same as what's done in the epic
	for (let notepad of resolvedNotepads) {
		const assets = notepad.notepadAssets;
		const usedAssets = getUsedAssets(notepad.flatten());
		const unusedAssets = assets.filter(uuid => !usedAssets.has(uuid));
		usedAssets.forEach(uuid => allUsedAssets.add(uuid));

		await Promise.all(unusedAssets.map(uuid => assetStorage.removeItem(uuid)));

		// Update notepadAssets
		notepad = notepad.clone({ notepadAssets: Array.from(usedAssets) });

		await notepadStorage.setItem(notepad.title, await notepad.toJson(store.getState().notepadPasskeys[notepad.title]));
	}

	// Handle the deletion of assets we've lost track of and aren't in any notepad
	let lostAssets: string[] = [];
	await assetStorage.iterate((value, key) => {
		lostAssets.push(key);
		return;
	});
	lostAssets = lostAssets.filter(uuid => !allUsedAssets.has(uuid));

	for (const uuid of lostAssets) {
		await assetStorage.removeItem(uuid);
	}
}

export function getUsedAssets(notepad: FlatNotepad): Set<string> {
	return new Set(
		Object.values(notepad.notes)
		.map(
			n => n.elements
				.map(e => e.args.ext!)
				.filter(Boolean)
		)
		.reduce((used, cur) => used.concat(cur), [])
	);
}

/**
 * Safely travel through data that could be undefined
 */
export function elvis(obj: any): any {
	return new Proxy(typeof obj === 'object' ? { ...obj } : obj, {
		get: (target: object, key: PropertyKey): any => {
			// Thanks to https://www.beyondjava.net/elvis-operator-aka-safe-navigation-javascript-typescript
			const res = target[key];
			if (!!res) return res instanceof Object ? elvis(res) : res;

			return elvis(undefined);
		}
	});
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
