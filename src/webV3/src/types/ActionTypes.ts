import { NoteElement } from './NotepadTypes';

export interface IUpdateElementAction {
	noteRef: string;
	elementId: string;
	element: NoteElement;
}
