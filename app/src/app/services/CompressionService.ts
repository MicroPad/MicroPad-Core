import { FlatNotepad } from 'upad-parse';
import { default as initPhoton, open_image, resize_img_browser } from '@nick_webster/photon';
import { NoteElement } from 'upad-parse/dist/Note';

let started = false;

export async function optimiseAssets(assetStorage: LocalForage, assetList: string[], notepad: FlatNotepad): Promise<Array<Blob | null>> {
	if (assetList.length > 0 && !started) {
		await initPhoton();
		started = true;
	}

	return await Promise.all(assetList.map(async uuid => {
		// Find element for asset
		const el = Object.values(notepad.notes)
			.flatMap(note => note.elements)
			.find(el => el.args.ext === uuid);

		const asset = await assetStorage.getItem<Blob>(uuid);
		if (!asset) return null;
		if (!el || el.type !== 'image') return asset;
		if (asset.type.includes('gif')) return asset;

		return await shrinkImage(asset, el);
	}));
}

export async function shrinkImage(image: Blob, el: NoteElement): Promise<Blob | null> {
	// Right now this uses Photon but in the future with better browser support, `createImageBitmap` will work
	// https://caniuse.com/mdn-api_createimagebitmap_resizewidth_resizeheight_resizequality

	let width = parseInt(el.args.width!, 10);
	let height = parseInt(el.args.height!, 10);
	if (!el.args.width?.endsWith('px') || !el.args.height?.endsWith('px')) {
		const domEl = document.querySelector<HTMLImageElement>(`[data-el-id="${el.args.id}"] img`);
		if (!domEl) return image;
		if (!el.args.width?.endsWith('px')) width = domEl.width;
		if (!el.args.height?.endsWith('px')) height = domEl.height;
	}
	if (isNaN(width) || isNaN(height)) return image;

	// Create a tmp canvas for photon to perform its operations on
	const photonImg = await (async () => {
		const canvas = await blob2Canvas(image);
		const ctx = canvas.getContext('2d')!;
		return open_image(canvas, ctx);
	})();

	const canvas = resize_img_browser(photonImg, width, height, 5);
	return await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png', 1.0));
}

function blob2Canvas(image: Blob): Promise<HTMLCanvasElement> {
	return new Promise<HTMLCanvasElement>(resolve => {
		const img = new Image();
		const blobUrl = URL.createObjectURL(image);
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext('2d')!;

			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(blobUrl);
			resolve(canvas);
		}
		img.src = blobUrl;
	});
}

