import { IParent, NoteElement } from './NotepadTypes';

export interface IUpdateElementAction {
	noteRef: string;
	elementId: string;
	element: NoteElement;
}

export interface INewNotepadObjectAction {
	title: string;
	parent: IParent;
}
