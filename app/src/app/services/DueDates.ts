import { FlatNotepad, Note } from 'upad-parse/dist';
import { DueDateSettingsState } from '../reducers/DueDateSettingsReducer';

export type DueItem = {
	date: Date,
	note: Note,
	notepadTitle: string
};

export function getDueDates(notepad: FlatNotepad, opts: DueDateSettingsState): DueItem[] {
	return Object.values(notepad.notes)
		.map(note => {
			const earliestDueDate = note.elements
				.map(element => element.args.dueDate)
				.filter((a?: string): a is string => !!a)
				.map(dueDate => parseInt(dueDate!, 10))
				.filter(due => {
					if (opts.showHistoricalDueDates) { return true; }
					return due >= new Date().getTime();
				})
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
