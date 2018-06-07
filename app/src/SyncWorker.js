import * as localforage from 'localforage';
import {getAsBase64} from './util';
import * as md5 from 'md5';
import * as Parser from 'upad-parse/dist/index';

export async function toSyncedNotepad(notepad) {
	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();

	const assetHashes = {};

	notepad = Parser.restoreNotepad(notepad);
	const npAssets = Array.from(notepad.getUsedAssets());

	// Get assets from storage as base64
	const base64Assets = await Promise.all((await Promise.all(npAssets.map(uuid => ASSET_STORAGE.getItem(uuid))))
		.map((blob) => {
			try {
				return getAsBase64(blob);
			} catch (e) {
				return null;
			}
		}));

	// Build up the asset list
	base64Assets
		.filter(base64 => !!base64 && base64.length > 0)
		.map(base64 => md5(base64))
		.forEach((hash, i) => assetHashes[npAssets[i]] = hash);

	return Object.assign({}, notepad, { assetHashList: assetHashes, notepadAssets: npAssets });
}
