import localforage from 'localforage';
import { getUsedAssets } from '../../util';
import { crc32 } from '../../services/crc';
import { FlatNotepad } from 'upad-parse/dist';

const ASSET_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'assets'
});

export async function getAssetInfoImpl(notepad: FlatNotepad): Promise<{ assets: { [assetRef: string]: number } }> {
	// Setup access to our binary assets
	await ASSET_STORAGE.ready();

	const notepadAssets = Array.from(getUsedAssets(notepad));

	// Get assets from storage as byte arrays
	const assetBlobs: Array<Blob | null> = await Promise.all(notepadAssets.map(uuid => ASSET_STORAGE.getItem<Blob>(uuid)))

	const assets: Record<string, number> = {};
	for (let i = 0; i < notepadAssets.length; ++i) {
		const blob = assetBlobs[i];
		if (!blob || !blob.size) continue;

		assets[notepadAssets[i]] = crc32(new Uint8Array(await blob.arrayBuffer()));
	}

	return { assets };
}
