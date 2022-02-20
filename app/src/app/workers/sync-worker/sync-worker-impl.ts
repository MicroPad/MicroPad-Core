import localforage from 'localforage';
import { getUsedAssets } from '../../util';
import { crc32 } from '../../services/crc';
import { FlatNotepad } from 'upad-parse/dist';
import { ISyncedNotepad } from '../../types/SyncTypes';

const ASSET_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'assets'
});

const MAX_ASSET_SIZE = 50 * 1024 * 1024; // 50MiB

export async function getAssetInfoImpl(notepad: FlatNotepad): Promise<{ assets: { [assetRef: string]: string | number }, hasOversizedAssets: number, assetTypes: ISyncedNotepad['assetTypes'] }> {
	// Setup access to our binary assets
	await ASSET_STORAGE.ready();

	const notepadAssets = Array.from(getUsedAssets(notepad));

	// Get assets from storage as byte arrays
	const assetBlobs: Array<Blob | null> = await Promise.all(notepadAssets.map(uuid => ASSET_STORAGE.getItem<Blob>(uuid)))

	const assets: Record<string, string | number> = {};
	const assetTypes: ISyncedNotepad['assetTypes'] = {};
	let hasOversizedAssets: number = 0;
	for (let i = 0; i < notepadAssets.length; ++i) {
		const blob = assetBlobs[i];
		if (!blob || !blob.size) continue;

		assetTypes[notepadAssets[i]] = blob.type;

		// Skip oversized assets
		if (blob.size > MAX_ASSET_SIZE) {
			hasOversizedAssets++;
			continue;
		}

		// Find element for asset
		const el = Object.values(notepad.notes)
			.flatMap(note => note.elements)
			.find(el => el.args.ext === notepadAssets[i]);
		if (el?.type === 'image') {
			assets[notepadAssets[i]] = `${crc32(new Uint8Array(await blob.arrayBuffer()))}-w=${el.args.width}&h=${el.args.height}`;
		} else {
			assets[notepadAssets[i]] = crc32(new Uint8Array(await blob.arrayBuffer()));
		}
	}

	return { assets, hasOversizedAssets, assetTypes };
}
