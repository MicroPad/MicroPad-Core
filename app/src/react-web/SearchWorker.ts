import * as localforage from 'localforage';
import { FlatNotepad, Translators, Trie } from 'upad-parse/dist';
import { SearchIndices } from '../core/types/ActionTypes';

export async function indexNotepads(indices: SearchIndices) {
	const NOTEPAD_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'notepads'
	});
	await NOTEPAD_STORAGE.ready();

	const notepads: FlatNotepad[] = [];
	await NOTEPAD_STORAGE.iterate((json) => {
		try {
			notepads.push(Translators.Json.toFlatNotepadFromNotepad(json));
		} catch (e) {
			console.warn(`Couldn't parse notepad: ${e}`);
		}
		return;
	});

	return notepads
		.map(notepad => {
			if (!!indices[notepad.title] && !indices[notepad.title].shouldReindex(new Date(), Object.keys(notepad.notes).length)) {
				return { notepad: notepad, trie: indices[notepad.title] };
			}

			return { notepad: notepad, trie: Trie.buildTrie(notepad.notes) };
		});
}
