import { getAsBase64, getBytes, getUsedAssets } from './util';
import { Translators } from 'upad-parse';
import * as localforage from 'localforage';
import * as md5 from 'md5';

// import { init, checksum } from 'asset-checksum';

export async function toSyncedNotepad(notepad) {
	// Setup access to our binary assets
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});
	await ASSET_STORAGE.ready();
	const { checksum } = await import('asset-checksum');

	const assetHashes = {};

	notepad = await Translators.Json.toNotepadFromNotepad(notepad);
	const npAssets = Array.from(getUsedAssets(notepad.flatten()));

	performance.mark('md5');
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

	performance.measure('md5 time', 'md5');

	performance.mark('sum');
	// Get assets from storage as byte arrays
	let assetBytes = await Promise.all((await Promise.all(npAssets.map(uuid => ASSET_STORAGE.getItem(uuid))))
		.map((blob) => {
			try {
				return getBytes(blob);
			} catch (e) {
				return null;
			}
		}));

	// Build up the asset list
	assetBytes
		.filter(bytes => !!bytes && bytes.length > 0)
		.map(bytes => bytes.reduce((acc, cur) => acc + cur, 0))
		.forEach((sum, i) => assetHashes[npAssets[i]] = sum.toString());

	performance.measure('sum time', 'sum');

	performance.mark('crc');
	// Get assets from storage as byte arrays
	assetBytes = await Promise.all((await Promise.all(npAssets.map(uuid => ASSET_STORAGE.getItem(uuid))))
		.map((blob) => {
			try {
				return getBytes(blob);
			} catch (e) {
				return null;
			}
		}));

	// Build up the asset list
	assetBytes
		.filter(bytes => !!bytes && bytes.length > 0)
		.map(bytes => checksum(bytes))
		.forEach((sum, i) => assetHashes[npAssets[i]] = sum.toString());

	performance.measure('crc time', 'crc');

	debugger;
	return Object.assign({}, notepad, { assetHashList: assetHashes, notepadAssets: npAssets });
}
