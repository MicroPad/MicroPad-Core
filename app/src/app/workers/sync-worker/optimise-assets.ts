/* eslint-disable */
self.global = self;
require('buffer/');

import localforage from 'localforage';
import { FlatNotepad } from 'upad-parse/dist';
import { default as initPhoton, open_image } from '@nick_webster/photon';
import { NoteElement } from 'upad-parse/dist/Note';
/* eslint-enable */

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

export async function shrinkImage(image: Blob, el: NoteElement): Promise<Blob> {
	// TODO: In the future when resizing is better supported just use https://caniuse.com/mdn-api_createimagebitmap_resizewidth_resizeheight_resizequality
	// Create a tmp canvas for photon to perform its operations on
	const Image = await import('canvas-webworker/lib/Image').then(m => m.default);
	const canvas = await blob2Canvas(image, Image);

	const ctx = canvas.getContext('2d')!;
	const photonImg = open_image(canvas as unknown as HTMLCanvasElement, ctx as unknown as CanvasRenderingContext2D);

	console.log(photonImg);
	return image;
}

function blob2Canvas(image: Blob, Img: typeof Image): Promise<OffscreenCanvas> {
	return new Promise<OffscreenCanvas>(resolve => {
		const img = new Img();
		const blobUrl = URL.createObjectURL(image);
		img.onload = () => {
			const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(blobUrl);
			resolve(canvas);
		}
		img.src = blobUrl;
	});
}
