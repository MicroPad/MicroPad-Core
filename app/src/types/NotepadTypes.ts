import { FlatNotepad } from 'upad-parse/dist';

export interface IElementArgs {
	id: string;
	x: string;
	y: string;
	width?: string;
	height?: string;
	fontSize?: string;
	filename?: string;
	ext?: string;
}

export interface INotepadsStoreState {
	isLoading: boolean;
	savedNotepadTitles?: string[];
	notepad?: INotepadStoreState;
}

export interface INotepadStoreState {
	isLoading: boolean;
	saving: boolean;
	activeSyncId?: string;
	item?: FlatNotepad;
}

export interface IRenameNotepadObjectAction {
	internalRef: string;
	newName: string;
}
