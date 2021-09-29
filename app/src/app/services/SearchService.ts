import { SearchIndex, SearchIndices, SearchResultInfo } from '../types/ActionTypes';
import { SearchResults } from '../reducers/SearchReducer';
import localforage from 'localforage';
import { NotepadPasskeysState } from '../reducers/NotepadPasskeysReducer';
import { FlatNotepad } from 'upad-parse';
import { Translators, Trie } from 'upad-parse/dist';
import { NotepadShell } from 'upad-parse/dist/interfaces';

export function search(query: string, searchIndices: SearchIndices): SearchResults {
	const results: SearchResults = {};

	if (!query.length) return results;

	query.split(' ').forEach(term =>
		searchIndices.forEach(index =>
			Trie.search(index.trie, term)
				.map(noteRef => index.searchResultInfo[noteRef])
				.forEach(result => {
					results[index.notepadTitle] ??= [];
					results[index.notepadTitle].push(result);
				})
		)
	);

	Object.keys(results).forEach(notepad => {
		const resultList = results[notepad];
		results[notepad] = resultList.sort((a, b) =>
			Math.abs(query.length - a.title.length) - Math.abs(query.length - b.title.length)
		);
	});

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
				.map((notepad: FlatNotepad): SearchIndex => {
					if (!!indices[notepad.title] && !indices[notepad.title].shouldReindex(new Date(), Object.keys(notepad.notes).length)) {
						return {
							notepadTitle: notepad.title,
							trie: indices[notepad.title],
							searchResultInfo: getSearchResultInfo(notepad)
						};
					}

					return {
						notepadTitle: notepad.title,
						trie: Trie.buildTrie(notepad.notes),
						searchResultInfo: getSearchResultInfo(notepad)
					};
				})
		);
}

function getSearchResultInfo(notepad: FlatNotepad): SearchResultInfo {
	const info: SearchResultInfo = {};

	for (const noteRef of Object.keys(notepad.notes)) {
		const note = notepad.notes[noteRef];
		info[noteRef] = {
			noteRef,
			title: note.title,
			parentTitle: notepad.sections[note.parent as string].title
		};
	}

	return info;
}
