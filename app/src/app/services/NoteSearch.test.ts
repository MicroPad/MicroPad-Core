import type Note from 'upad-parse/dist/Note';
import type { NoteElement } from 'upad-parse/dist/Note';
import { makeSnippet, MAX_ELEMENT_RESULTS, searchNoteElements } from './NoteSearch';

function markdownElement(id: string, content: string): NoteElement {
	return {
		type: 'markdown',
		content,
		args: { id, x: '0px', y: '0px' }
	};
}

function noteWith(...elements: NoteElement[]): Note {
	return { elements } as unknown as Note;
}

describe('searchNoteElements', () => {
	it('returns no results for an empty or whitespace query', () => {
		const note = noteWith(markdownElement('markdown1', 'hello world'));

		expect(searchNoteElements('', note)).toEqual([]);
		expect(searchNoteElements('   ', note)).toEqual([]);
	});

	it('returns no results when there is no note', () => {
		expect(searchNoteElements('hello', undefined)).toEqual([]);
	});

	it('matches case-insensitively', () => {
		const note = noteWith(markdownElement('markdown1', 'say Hello to the world'));

		const results = searchNoteElements('HELLO', note);

		expect(results).toHaveLength(1);
		expect(results[0].elementId).toBe('markdown1');
	});

	it('ignores non-markdown elements and asset-stored content', () => {
		const image: NoteElement = { type: 'image', content: 'AS', args: { id: 'image1', x: '0px', y: '0px' } };
		const note = noteWith(image, markdownElement('markdown1', 'AS'));

		expect(searchNoteElements('as', note)).toEqual([]);
	});

	it('returns one result per element with the number of non-overlapping matches', () => {
		const note = noteWith(
			markdownElement('markdown1', 'banana banana banana'),
			markdownElement('markdown2', 'aaaa'),
			markdownElement('markdown3', 'no fruit here')
		);

		const bananas = searchNoteElements('banana', note);
		expect(bananas).toHaveLength(1);
		expect(bananas[0]).toEqual(expect.objectContaining({ elementId: 'markdown1', matchCount: 3 }));

		const pairs = searchNoteElements('aa', note);
		expect(pairs).toHaveLength(1);
		expect(pairs[0]).toEqual(expect.objectContaining({ elementId: 'markdown2', matchCount: 2 }));
	});

	it('caps the number of results', () => {
		const elements = Array.from({ length: MAX_ELEMENT_RESULTS + 5 }, (_, i) => markdownElement(`markdown${i}`, 'match me'));
		const note = noteWith(...elements);

		expect(searchNoteElements('match', note)).toHaveLength(MAX_ELEMENT_RESULTS);
	});
});

describe('makeSnippet', () => {
	it('adds ellipses on both sides for a match in the middle of long content', () => {
		const content = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`;
		const matchIndex = content.indexOf('needle');

		const snippet = makeSnippet(content, matchIndex, 'needle'.length);

		expect(snippet.startsWith('…')).toBe(true);
		expect(snippet.endsWith('…')).toBe(true);
		expect(snippet).toContain('needle');
	});

	it('omits ellipses at the start and end of content', () => {
		const snippet = makeSnippet('needle in a haystack', 0, 'needle'.length);

		expect(snippet.startsWith('…')).toBe(false);
		expect(snippet).toContain('needle');

		const content = 'a haystack hiding a needle';
		const endSnippet = makeSnippet(content, content.indexOf('needle'), 'needle'.length);
		expect(endSnippet.endsWith('…')).toBe(false);
	});

	it('collapses newlines and repeated whitespace', () => {
		const content = 'one\ntwo\r\n\r\nthree    four';

		expect(makeSnippet(content, 0, content.length)).toBe('one two three four');
	});

	it('strips light markdown noise', () => {
		const content = '## Heading with **bold** and `code`';

		expect(makeSnippet(content, 0, content.length)).toBe('Heading with bold and code');
	});
});
