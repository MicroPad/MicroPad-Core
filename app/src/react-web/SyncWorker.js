import { getAsBase64, getUsedAssets } from './util';
import { Translators } from 'upad-parse';
import * as localforage from 'localforage';
import * as md5 from 'md5';

export async function toSyncedNotepad(notepad) {
	debugger;

	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();

	const assetHashes = {};

	notepad = await Translators.Json.toNotepadFromNotepad(notepad);
	const npAssets = Array.from(getUsedAssets(notepad.flatten()));

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
