import { NoteElement } from 'upad-parse/dist/Note';

export async function shrinkImage(image: Blob, el: NoteElement): Promise<Blob> {
	const photon = await import('@silvia-odwyer/photon');

	return image;
}