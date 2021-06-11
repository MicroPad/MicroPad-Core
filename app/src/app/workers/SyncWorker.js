import * as localforage from 'localforage';
import { getUsedAssets } from '../util';
import { crc32 } from '../services/crc';

/** @typedef {typeof import('upad-parse/dist/FlatNotepad')} FlatNotepad*/

/**
 * @param {FlatNotepad} flatNotepad
 * @returns {Promise<{ assets: Object.<string, number> }>}>}>}
 */
export async function getAssetInfo(flatNotepad) {
	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();

	const notepadAssets = Array.from(getUsedAssets(flatNotepad));

	// Get assets from storage as byte arrays
	const assetBlobs = await Promise.all(notepadAssets.map(uuid => ASSET_STORAGE.getItem(uuid)))

	const assets = {};
	for (let i = 0; i < notepadAssets.length; ++i) {
		const blob = assetBlobs[i];
		if (!blob || !blob.size) continue;

		assets[notepadAssets[i]] = crc32(new Uint8Array(await blob.arrayBuffer()));
	}

	return { assets };
}
