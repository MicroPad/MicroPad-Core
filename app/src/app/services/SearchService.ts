import { SearchIndices } from '../types/ActionTypes';
import { SearchResults } from '../reducers/SearchReducer';

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
