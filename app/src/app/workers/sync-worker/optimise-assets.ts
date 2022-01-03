import localforage from 'localforage';
import { FlatNotepad } from 'upad-parse/dist';
import { default as initPhoton, open_image } from '@nick_webster/photon';
import { NoteElement } from 'upad-parse/dist/Note';

const ASSET_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'assets'
});

let started = false;

/**
 * INTERNAL USE BY WORKER. CALLING THIS DIRECTLY WILL RUN ON THE MAIN THREAD
 */
export async function _optimiseAssets(assetList: string[], notepad: FlatNotepad): Promise<Array<Blob | null>> {
	if (!started) {
		// TODO: this won't work in Firefox until they support ESM workers
		await initPhoton();
		started = true;
	}

	return await Promise.all(assetList.map(async uuid => {
		// Find element for asset
		const el = Object.values(notepad.notes)
			.flatMap(note => note.elements)
			.find(el => el.args.ext === uuid);
		if (!el || el.type !== 'image') return null;

		const asset = await ASSET_STORAGE.getItem<Blob>(uuid);
		if (!asset) return null;

		return await shrinkImage(asset, el);
	}));
}

