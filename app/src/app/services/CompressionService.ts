import { FlatNotepad } from 'upad-parse';
import { ASSET_STORAGE } from '../root';
import { NoteElement } from 'upad-parse/dist/Note';
import { open_image } from '@nick_webster/photon';

const AssetOptimiserWorker = new Worker(build.defs.SYNC_WORKER_PATH, { type: 'module' });

export async function runOptimiseAssets(assetList: string[], notepad: FlatNotepad): Promise<Array<Blob | null>> {
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
	// Create a tmp canvas for photon to perform its operations on
	const canvas = await blob2Canvas(image);
	const ctx = canvas.getContext('2d')!;

	const photonImg = open_image(canvas as unknown as HTMLCanvasElement, ctx as unknown as CanvasRenderingContext2D);

	console.log(photonImg);
	return image;
}

function blob2Canvas(image: Blob): Promise<OffscreenCanvas> {
	return new Promise<OffscreenCanvas>(resolve => {
		const img = new Image();
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

