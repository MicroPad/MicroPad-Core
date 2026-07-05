import type Note from 'upad-parse/dist/Note';

export type ElementSearchResult = {
	elementId: string;
	snippet: string;
	matchCount: number;
};

export const SNIPPET_CONTEXT_CHARS = 35;
export const MAX_ELEMENT_RESULTS = 20;

/** Case-insensitive substring scan of the markdown elements of a note. One result per matching element. */
export function searchNoteElements(query: string, note: Note | undefined): ElementSearchResult[] {
	const q = query.trim().toLowerCase();
	if (!q.length || !note) return [];

	const results: ElementSearchResult[] = [];
	for (const element of note.elements) {
		if (element.type !== 'markdown' || element.content === 'AS') continue;

		const haystack = element.content.toLowerCase();
		const firstIdx = haystack.indexOf(q);
		if (firstIdx === -1) continue;

		let matchCount = 0;
		for (let i = firstIdx; i !== -1; i = haystack.indexOf(q, i + q.length)) matchCount++;

		results.push({
			elementId: element.args.id,
			snippet: makeSnippet(element.content, firstIdx, q.length),
			matchCount
		});

		if (results.length >= MAX_ELEMENT_RESULTS) break;
	}

	return results;
}

/** A window of context around the match, whitespace collapsed, with ellipses where the content was cut. */
export function makeSnippet(content: string, matchIndex: number, matchLength: number, context: number = SNIPPET_CONTEXT_CHARS): string {
	const start = Math.max(0, matchIndex - context);
	const end = Math.min(content.length, matchIndex + matchLength + context);

	const clean = content
		.substring(start, end)
		.replace(/[#>*_`]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	return `${start > 0 ? '…' : ''}${clean}${end < content.length ? '…' : ''}`;
}
