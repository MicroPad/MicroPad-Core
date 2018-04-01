import { IAsset, IAssets, INote, INotepad, ISection } from './types/NotepadTypes';
import * as Parser from 'upad-parse/dist/index';
import { ASSET_STORAGE } from './index';

export function stringify(obj: object) {
	const seen: any[] = [];
	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === 'object') {
			if (seen.indexOf(val) > -1) return;
			seen.push(val);
		}
		return val;
	});
}

export function restoreObject<T>(objectToRestore: T, template: T): T {
	objectToRestore['__proto__'] = { ...template['__proto__'] };
	return objectToRestore;
}

export function getNotepadObjectByRef(notepad: INotepad, ref: string, actionOnObj: (obj: ISection | INote) => ISection | INote): INotepad {
	for (let section of notepad.sections) {
		let res = findInSection(section);
		if (!!res) {
			res = actionOnObj(res);
			return notepad;
		}
	}

	function findInSection(section: ISection): ISection | INote | false {
		if (section.internalRef === ref) return section;
		for (let note of section.notes) if (note.internalRef === ref) return note;
		for (let subSection of section.sections) {
			const res = findInSection(subSection);
			if (!!res) return res;
		}

		return false;
	}

	return notepad;
}

export function isDev(): boolean {
	return (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
}

// Thanks to https://stackoverflow.com/a/105074
export function generateGuid(): string {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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
