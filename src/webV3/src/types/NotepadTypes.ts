export interface INotepadStoreState {
	savedNotepadTitles: string[];
	notepads: Notepad[];
}

export interface NPXObject {
	title: string;
	toXML: (toXMLCallback, Assets) => void;
	toXMLObject: (toXMLObjectCallback) => void;
}

export interface Parent extends NPXObject {
	sections: Section[];

	search: (string) => Note[];
	addSection: (Section) => void;
}

export interface Notepad extends Parent {
	assets: Assets;
	notepadAssets: Set<string>;
	lastModified: string;

	getUsedAssets: () => Set<string>;
	toMarkdown: (ToMarkdownCallback, Assets) => void;
}

export interface Section extends Parent {
	parent: Parent;
	notes: Note[];

	addNote: (Note) => void;
	getUsedAssets: () => string[];
	toMarkdown: (object) => MarkdownNote[];
}

export interface Note extends NPXObject {
	getUsedAssets: () => string[];
}

export interface MarkdownNote {
	title: string;
	md: string;
}

export interface Assets {
	assets: Asset[];
}

export interface Asset {

}

export type ToMarkdownCallback = (markdownNotes: MarkdownNote[]) => void;
export type toXMLCallback = (xml: string) => void;
export type toXMLObjectCallback = (xmlObject: object) => void;
