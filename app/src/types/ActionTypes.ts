import { INotepad, IParent, NoteElement, Source } from './NotepadTypes';
import { ISyncedNotepad } from './SyncTypes';
import { Action } from 'redux-typescript-actions';

export interface IUpdateElementAction {
	noteRef: string;
	elementId: string;
	element: NoteElement;
	newAsset?: Blob;
}

export interface INewNotepadObjectAction {
	title: string;
	parent: IParent;
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

export interface IUploadAssetAction {
	asset: Blob;
	url: string;
}

export interface INotepadToSyncNotepadAction {
	notepad: INotepad;
	action: (notepad: ISyncedNotepad) => Action<any>;
}
