import { ISyncedNotepad, SyncUser } from './SyncTypes';
import { Action } from 'redux-typescript-actions';
import { NoteElement, Source } from 'upad-parse/dist/Note';
import { Notepad } from 'upad-parse/dist';

export interface IUpdateElementAction {
	noteRef: string;
	elementId: string;
	element: NoteElement;
	newAsset?: Blob;
}

export interface INewNotepadObjectAction {
	title: string;
	parent?: string;
}

export interface IInsertElementAction {
	noteRef: string;
	element: NoteElement;
}

export interface IDeleteElementAction {
	noteRef: string;
	elementId: string;
}

export interface IUpdateBibliographyAction {
	noteRef: string;
	sources: Source[];
}

export interface ISyncAction {
	syncId: string;
	notepad: ISyncedNotepad;
}

export interface IAddToSyncAction {
	user: SyncUser;
	notepadTitle: string;
}

export interface IUploadAssetAction {
	asset: Blob;
	url: string;
}

export interface INotepadToSyncNotepadAction {
	notepad: Notepad;
	action: (notepad: ISyncedNotepad) => Action<any>;
}
