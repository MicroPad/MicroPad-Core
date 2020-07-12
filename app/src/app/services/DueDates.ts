import { FlatNotepad, Note } from 'upad-parse/dist';

export type DueItem = {
	date: Date,
	note: Note,
	notepadTitle: string
};

export function getDueDates(notepad: FlatNotepad): DueItem[] {
	return Object.values(notepad.notes)
		.map(note => {
			const earliestDueDate = note.elements
				.map(element => element.args.dueDate)
				.filter(Boolean)
				.map(dueDate => parseInt(dueDate!, 10))
				.filter(due => due >= new Date().getTime())
				.sort()[0];

			return {
				note,
				date: !!earliestDueDate ? new Date(earliestDueDate) : undefined,
				notepadTitle: notepad.title
			};
		})
		.filter((dueItem: Partial<DueItem>): dueItem is DueItem => !!dueItem.date);
}

export function sortDueDates(dueItems: DueItem[]): DueItem[] {
	return dueItems.sort((a, b) => a.date.getTime() - b.date.getTime());
}
