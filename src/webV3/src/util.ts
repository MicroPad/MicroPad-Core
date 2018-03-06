import { IAsset, IAssets, INote, INotepad, INPXObject, ISection } from './types/NotepadTypes';
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

export interface IExportedNotepad {
	title: string;
	xml: string;
}

export function getNotepadXmlWithAssets(notepad: INotepad): Promise<IExportedNotepad> {
	return new Promise<IExportedNotepad>((resolve, reject) => {
		try {
			getAssets(notepad.notepadAssets)
				.then((assets: IAssets) => notepad.toXML((xml: string) => {
					notepad.assets = new Parser.Assets();
					resolve({title: notepad.title, xml});
				}, assets))
				.catch((err) => reject(err));
		} catch (err) {
			reject(err);
		}
	});

	function getAssets(notepadAssets: string[]): Promise<IAssets> {
		return new Promise<IAssets>(resolve => {
			const assets: IAssets = new Parser.Assets();

			if (!notepadAssets || notepadAssets.length === 0) {
				resolve(assets);
				return;
			}

			const resolvedAssets: Promise<Blob>[] = [];
			for (let uuid of notepadAssets) {
				resolvedAssets.push(ASSET_STORAGE.getItem(uuid));
			}

			Promise.all(resolvedAssets)
				.then((blobs: Blob[]) => {
					blobs.forEach((blob: Blob, i: number) => {
						let asset: IAsset = new Parser.Asset(blob);
						asset.uuid = notepadAssets[i];
						assets.addAsset(asset);
					});

					resolve(assets);
				});
		});
	}
}

export function restoreObject(objectToRestore: object, template: object): object {
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

// Thanks to https://stackoverflow.com/a/105074
export function generateGuid(): string {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
