import { IAsset, IAssets, INotepad } from './types/NotepadTypes';
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

// Thanks to https://stackoverflow.com/a/105074
export function generateGuid(): string {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
