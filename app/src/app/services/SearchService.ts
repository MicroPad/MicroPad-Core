import { SearchIndices } from '../types/ActionTypes';
import { SearchResults } from '../reducers/SearchReducer';
import localforage from 'localforage';
import { NotepadPasskeysState } from '../reducers/NotepadPasskeysReducer';
import { FlatNotepad } from 'upad-parse';
import { Translators, Trie } from 'upad-parse/dist';
import { NotepadShell } from 'upad-parse/dist/interfaces';

export function search(query: string, searchIndices: SearchIndices): SearchResults {
	// Create a data structure with each notepad being the key to all the results for that hashtag's search
	const results: SearchResults = {};

	// Hashtag search
	if (query.length > 1 || query.substring(0, 1) === '#') {
		searchIndices.forEach(index =>
			index.notepad.search(index.trie, query)
				.map(note => ({
					title: note.title,
					parentTitle: index.notepad.sections[note.parent as string].title,
					noteRef: note.internalRef
				}))
				.forEach(result => {
					results[index.notepad.title] ??= [];
					results[index.notepad.title].push(result);
				})
		);

		return results;
	}

	// TODO: General search
	return results;
}

export async function indexNotepads(indices: SearchIndices, passkeys: NotepadPasskeysState) {
	const NOTEPAD_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'notepads'
	});
	await NOTEPAD_STORAGE.ready();

	const notepads: Promise<FlatNotepad | void>[] = [];
	await NOTEPAD_STORAGE.iterate((json: string) => {
		let shell: NotepadShell;
		try {
			shell = JSON.parse(json);
		} catch (ignored) {
			return;
		}

		notepads.push(
			Translators.Json.toFlatNotepadFromNotepad(shell, passkeys[shell.title])
				.catch(e => console.warn(`Couldn't parse notepad: ${e}`))
		);
		return;
	});

	return Promise.all(notepads)
		.then(resolvedNotepads =>
			resolvedNotepads
				.filter((notepad): notepad is FlatNotepad => !!notepad)
				.map((notepad: FlatNotepad) => {
					if (!!indices[notepad.title] && !indices[notepad.title].shouldReindex(new Date(), Object.keys(notepad.notes).length)) {
						return { notepad: notepad, trie: indices[notepad.title] };
					}

					return { notepad: notepad, trie: Trie.buildTrie(notepad.notes) };
				})
		);
}
