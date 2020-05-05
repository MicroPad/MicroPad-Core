import { FlatNotepad } from 'upad-parse/dist';

export interface INotepadsStoreState {
	isLoading: boolean;
	savedNotepadTitles?: string[];
	notepad?: INotepadStoreState;
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
