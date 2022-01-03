import { NoteElement } from 'upad-parse/dist/Note';
import { open_image } from '@nick_webster/photon';

export async function shrinkImage(image: Blob, el: NoteElement): Promise<Blob> {
	// Create a tmp canvas for photon to perform its operations on
	const canvas = await blob2Canvas(image);
	const ctx = canvas.getContext('2d')!;

	const photonImg = open_image(canvas, ctx);

	debugger;
	return image;
}

function blob2Canvas(image: Blob): Promise<HTMLCanvasElement> {
	return new Promise<HTMLCanvasElement>(resolve => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		const img = new Image();
		const blobUrl = URL.createObjectURL(image);
		img.onload = () => {
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(blobUrl);
			resolve(canvas);
		}
		img.src = blobUrl;
	});
}
