import { FlatNotepad, Note, Section } from 'upad-parse/dist';
import { NotepadsReducer } from './NotepadsReducer';
import { actions } from '../actions';
import { INotepadsStoreState } from '../types/NotepadTypes';

// isReadOnlyNotebook reads the browser `location` global, which doesn't exist under Jest
jest.mock('../ReadOnly', () => ({ isReadOnlyNotebook: () => false }));

const reducer = new NotepadsReducer();

/**
 * Fixture tree (map insertion order = sibling order):
 *
 * Test
 * ├── A
 * │   ├── A1
 * │   │   └── A1X
 * │   ├── N1
 * │   └── N2
 * └── B
 *     └── N3
 */
function buildState(): { state: INotepadsStoreState, refs: { [name: string]: string } } {
	const a = FlatNotepad.makeFlatSection('A');
	const b = FlatNotepad.makeFlatSection('B');
	const a1 = FlatNotepad.makeFlatSection('A1', a.internalRef);
	const a1x = FlatNotepad.makeFlatSection('A1X', a1.internalRef);

	const n1 = new Note('N1').clone({ parent: a.internalRef });
	const n2 = new Note('N2').clone({ parent: a.internalRef });
	const n3 = new Note('N3').clone({ parent: b.internalRef });

	const notepad = new FlatNotepad('Test')
		.addSection(a).addSection(b).addSection(a1).addSection(a1x)
		.addNote(n1).addNote(n2).addNote(n3);

	const state: INotepadsStoreState = {
		...reducer.initialState,
		notepad: { isLoading: false, saving: false, isReadOnly: false, item: notepad }
	};

	return {
		state,
		refs: {
			a: a.internalRef, b: b.internalRef, a1: a1.internalRef, a1x: a1x.internalRef,
			n1: n1.internalRef, n2: n2.internalRef, n3: n3.internalRef
		}
	};
}

function sectionAt(notepad: FlatNotepad, ...titles: string[]): Section {
	let sections: Section[] = notepad.toNotepad().sections;
	let section: Section | undefined;
	for (const title of titles) {
		section = sections.find(s => s.title === title);
		if (!section) throw new Error(`No section at ${titles.join(' > ')}`);
		sections = section.sections;
	}
	return section!;
}

function moveObj(state: INotepadsStoreState, payload: Parameters<typeof actions.moveNotepadObject>[0]): INotepadsStoreState {
	return reducer.reducer(state, actions.moveNotepadObject(payload));
}

describe('NotepadsReducer.moveNotepadObject', () => {
	describe('reordering', () => {
		it('moves a note to the end of its own section', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'note', objectRef: refs.n1, newParent: refs.a, position: 'end' });

			expect(sectionAt(res.notepad!.item!, 'A').notes.map(n => n.title)).toEqual(['N2', 'N1']);
		});

		it('moves a note up, before an earlier sibling', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'note', objectRef: refs.n2, newParent: refs.a, position: { beforeRef: refs.n1 } });

			expect(sectionAt(res.notepad!.item!, 'A').notes.map(n => n.title)).toEqual(['N2', 'N1']);
		});
	});

	describe('reparenting with a position', () => {
		it('moves a note into another section at a given position', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'note', objectRef: refs.n3, newParent: refs.a, position: { beforeRef: refs.n2 } });

			expect(sectionAt(res.notepad!.item!, 'A').notes.map(n => n.title)).toEqual(['N1', 'N3', 'N2']);
			expect(sectionAt(res.notepad!.item!, 'B').notes).toHaveLength(0);
		});

		it('moves a section into another section, bringing its subtree along', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'section', objectRef: refs.b, newParent: refs.a1, position: 'end' });

			expect(sectionAt(res.notepad!.item!, 'A', 'A1').sections.map(s => s.title)).toEqual(['A1X', 'B']);
			expect(sectionAt(res.notepad!.item!, 'A', 'A1', 'B').notes.map(n => n.title)).toEqual(['N3']);
			expect(res.notepad!.item!.toNotepad().sections.map(s => s.title)).toEqual(['A']);
		});

		it('moves a section to the notebook root before an existing root section', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'section', objectRef: refs.a1, newParent: 'notepad', position: { beforeRef: refs.a } });

			expect(res.notepad!.item!.toNotepad().sections.map(s => s.title)).toEqual(['A1', 'A', 'B']);
			expect(sectionAt(res.notepad!.item!, 'A1').sections.map(s => s.title)).toEqual(['A1X']);
		});

		it('degrades to appending when beforeRef does not exist', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'note', objectRef: refs.n1, newParent: refs.a, position: { beforeRef: 'no-such-ref' } });

			expect(sectionAt(res.notepad!.item!, 'A').notes.map(n => n.title)).toEqual(['N2', 'N1']);
		});
	});

	describe('legacy behaviour (no position given)', () => {
		it('changes the parent but keeps the flat map key order', () => {
			const { state, refs } = buildState();

			const res = moveObj(state, { type: 'note', objectRef: refs.n1, newParent: refs.b });

			expect((res.notepad!.item!.notes[refs.n1].parent as string)).toBe(refs.b);
			expect(Object.keys(res.notepad!.item!.notes)).toEqual(Object.keys(state.notepad!.item!.notes));
			expect(sectionAt(res.notepad!.item!, 'B').notes.map(n => n.title)).toEqual(['N1', 'N3']);
		});
	});

	describe('rejected moves return the state unchanged', () => {
		it('rejects moving a section into its own descendant', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'section', objectRef: refs.a, newParent: refs.a1x, position: 'end' })).toBe(state);
		});

		it('rejects moving a section into itself', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'section', objectRef: refs.a, newParent: refs.a, position: 'end' })).toBe(state);
		});

		it('rejects moving a note to the notebook root', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'note', objectRef: refs.n1, newParent: 'notepad', position: 'end' })).toBe(state);
		});

		it('rejects unknown objects and parents', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'note', objectRef: 'no-such-ref', newParent: refs.a, position: 'end' })).toBe(state);
			expect(moveObj(state, { type: 'note', objectRef: refs.n1, newParent: 'no-such-ref', position: 'end' })).toBe(state);
		});
	});

	describe('no-op moves do not bump lastModified', () => {
		it('ignores dropping a note where it already is', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'note', objectRef: refs.n1, newParent: refs.a, position: { beforeRef: refs.n2 } })).toBe(state);
		});

		it('ignores appending the last sibling to the end, even with other parents\' entries after it', () => {
			const { state, refs } = buildState();

			// n3 (section B) sits after n2 in the flat map, but n2 is already the last note of section A
			expect(moveObj(state, { type: 'note', objectRef: refs.n2, newParent: refs.a, position: 'end' })).toBe(state);
		});

		it('ignores inserting an object before itself', () => {
			const { state, refs } = buildState();

			expect(moveObj(state, { type: 'note', objectRef: refs.n1, newParent: refs.a, position: { beforeRef: refs.n1 } })).toBe(state);
		});
	});
});
