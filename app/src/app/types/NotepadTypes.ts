import { FlatNotepad } from 'upad-parse/dist';
import { DueItem } from '../services/DueDates';

export interface INotepadsStoreState {
	isLoading: boolean;
	savedNotepadTitles?: string[];
	notepad?: INotepadStoreState;
	dueDates: {
		isLoading: boolean;
		dueItems: DueItem[];
	};
}

export interface INotepadStoreState {
	isLoading: boolean;
	saving: boolean;
	activeSyncId?: string;
	scribe?: string;
	item?: FlatNotepad;
}

export interface IRenameNotepadObjectAction {
	internalRef: string;
	newName: string;
}
