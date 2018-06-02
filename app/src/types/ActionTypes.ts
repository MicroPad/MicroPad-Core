import { IParent, NoteElement, Source } from './NotepadTypes';
import { ISyncedNotepad } from './SyncTypes';

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
	syncId: string;
	assetId: string;
}
