import { ISyncedNotepad, SyncUser } from './SyncTypes';
import { NoteElement, Source } from 'upad-parse/dist/Note';
import { FlatNotepad, Note, Notepad, Trie } from 'upad-parse/dist';
import { MicroPadAction } from '../actions';

export type UpdateElementAction = {
	noteRef: string;
	elementId: string;
	element: NoteElement;
	newAsset?: Blob;
};

export type NewNotepadObjectAction = {
	title: string;
	parent?: string;
};

export type InsertElementAction = {
	noteRef: string;
	element: NoteElement;
};

export type DeleteElementAction = {
	noteRef: string;
	elementId: string;
};

export type UpdateBibliographyAction = {
	noteRef: string;
	sources: Source[];
};

export type SyncAction = {
	syncId: string;
	notepad: ISyncedNotepad;
};

export type AddToSyncAction = {
	user: SyncUser;
	notepadTitle: string;
};

export type UploadAssetAction = {
	asset: Blob;
	url: string;
};

export type NotepadToSyncNotepadAction = {
	notepad: Notepad;
	action: (notepad: ISyncedNotepad) => MicroPadAction;
};

export type ExpandFromNoteAction = {
	note: Note;
	notepad: FlatNotepad;
};

export type RestoreJsonNotepadAndLoadNoteAction = {
	notepadTitle: string;
	noteRef: string;
};

export type MoveNotepadObjectAction = {
	type: 'section' | 'note';
	objectRef: string;
	newParent: string;
};

export type EncryptNotepadAction = {
	notepad: Notepad;
	passkey: string;
};

export type AddCryptoPasskeyAction = {
	notepadTitle?: string;
	passkey: string;
};

export type SearchIndex = { notepad: FlatNotepad, trie: Trie };

export type SearchIndices = SearchIndex[];

export enum ZoomChange {
	INCREASE,
	DECREASE
}

export enum MoveAcrossNotepadsObjType {
	SECTION = 'section',
	NOTE = 'note'
}

export type MoveAcrossNotepadsAction = {
	newNotepadTitle: string,
	oldNotepad: FlatNotepad,
	internalRef: string,
	type: MoveAcrossNotepadsObjType
};
