import * as localforage from 'localforage';
import {getAsBase64} from './util';
import * as md5 from 'md5';

export async function toSyncedNotepad(notepad) {
	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();

	const assetHashes = {};
	if (!notepad.notepadAssets) return Object.assign({}, notepad, { assetHashList: assetHashes });

	// Get assets from storage as base64
	const base64Assets = await Promise.all((await Promise.all(notepad.notepadAssets.map(uuid => ASSET_STORAGE.getItem(uuid))))
		.map((blob) => getAsBase64(blob)));

	// Build up the asset list
	base64Assets.map(base64 => md5(base64))
		.forEach((hash, i) => assetHashes[notepad.notepadAssets[i]] = hash);

	return Object.assign({}, notepad, { assetHashList: assetHashes });
}
