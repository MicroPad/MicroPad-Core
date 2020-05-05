import { getAsBase64, getBytes, getUsedAssets } from '../util';
import { Translators } from 'upad-parse';
import * as localforage from 'localforage';

export async function getAssetInfo(notepad) {
	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();

	notepad = await Translators.Json.toNotepadFromNotepad(notepad);
	const npAssets = Array.from(getUsedAssets(notepad.flatten()));

	// Get assets from storage as byte arrays
	let assetBytes = await Promise.all((await Promise.all(npAssets.map(uuid => ASSET_STORAGE.getItem(uuid))))
		.map((blob) => {
			try {
				return getBytes(blob);
			} catch (e) {
				return null;
			}
		}));

	const assets = {};
	for (let i = 0; i < npAssets.length; ++i) {
		const bytes = assetBytes[i];
		if (!bytes) continue;

		assets[npAssets[i]] = bytes;
	}

	return { assets: assets, notepadAssets: npAssets }
	// return Object.assign({}, notepad, { assetHashList: assetHashes, notepadAssets: npAssets });
}
