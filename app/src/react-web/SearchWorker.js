import * as localforage from 'localforage';
import { FlatNotepad, Translators, Trie } from 'upad-parse/dist';
import { SearchIndices } from '../core/types/ActionTypes';
import { NotepadPasskeysState } from '../core/reducers/NotepadPasskeysReducer';
import { NotepadShell } from 'upad-parse/dist/interfaces';

export async function indexNotepads(indices, passkeys) {
	const NOTEPAD_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'notepads'
	});
	await NOTEPAD_STORAGE.ready();

	const notepads = [];
	await NOTEPAD_STORAGE.iterate((json) => {
		let shell;
		try {
			shell = JSON.parse(json);
		} catch (ignored) {
			return;
		}

		notepads.push(
			Translators.Json.toFlatNotepadFromNotepad(shell, passkeys[shell.title])
				.catch(e =>
					console.warn(`Couldn't parse notepad: ${e}`)
				)
		);
	});

	return Promise.all(notepads)
		.then(resolvedNotepads =>
			resolvedNotepads
				.filter(notepad => !!notepad)
				.map((notepad) => {
					if (!!indices[notepad.title] && !indices[notepad.title].shouldReindex(new Date(), Object.keys(notepad.notes).length)) {
						return { notepad: notepad, trie: indices[notepad.title] };
					}

					return { notepad: notepad, trie: Trie.buildTrie(notepad.notes) };
				})
		);
}
