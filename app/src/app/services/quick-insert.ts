import { generateGuid } from '../util';
import { NoteElement } from 'upad-parse/dist/Note';

export function elementFromInteraction(file: File, x: number, y: number): NoteElement {
	let type: NoteElement['type'] = file.type.startsWith('image/') ? 'image' : 'file';
	switch (file.type) {
		case 'application/pdf':
			type = 'pdf';
			break;
		default:
			break;
	}

	const id = type + generateGuid();
	return {
		type,
		content: 'AS',
		args: {
			id,
			x: x + 'px',
			y: y + 'px',
			width: 'auto',
			height: 'auto',
			ext: generateGuid(),
			filename: file.name
		}
	};
}