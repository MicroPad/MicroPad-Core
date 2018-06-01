export type ToMarkdownCallback = (markdownNotes: IMarkdownNote[]) => void;

export type ToXMLCallback = (xml: string) => void;

export type ToXMLObjectCallback = (xmlObject: object) => void;

export type Source = {
	id: string;
	item: string;
	content: string;
};

export type NoteElement = {
	type: string;
	content: string;
	args: IElementArgs;
};

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
	item?: INotepad;
}

export interface INPXObject {
	title: string;
	toXML: (callback: ToXMLCallback, assets: IAssets) => void;
	toXMLObject: (callback: ToXMLObjectCallback) => void;
}

export interface IParent extends INPXObject {
	sections: ISection[];

	search: (query: string) => INote[];
	addSection: (section: ISection) => void;
	internalRef?: string;
}

export interface INotepad extends IParent {
	assets: IAssets;
	notepadAssets: string[];
	lastModified: string;

	getUsedAssets: () => Set<string>;
	toMarkdown: (callback: ToMarkdownCallback, assets: IAssets) => void;
}

export interface ISection extends IParent {
	parent: IParent;
	notes: INote[];
	internalRef: string;

	addNote: (note: INote) => void;
	getUsedAssets: () => string[];
	toMarkdown: (b64assets: object) => IMarkdownNote[];
}

export interface INote extends INPXObject {
	addons: string[];
	bibliography: Source[];
	elements: NoteElement[];
	parent: IParent;
	time: number;
	internalRef: string;

	addSource: (id: string, item: string, content: string) => void;
	addElement: (type: string, args: IElementArgs, content: string) => void;
	search: (query: string) => INote;
	toXML: () => string;
	toXMLObject: () => object;
	toMarkdown: (b64assets: object) => IMarkdownNote;
	getUsedAssets: () => string[];
}

export interface IMarkdownNote {
	title: string;
	md: string;
}

export interface IAssets {
	assets: IAsset[];

	addAsset: (asset: IAsset) => void;
	getXmlObject: (callback: ToXMLObjectCallback) => void;
	getBase64Assets: (callback: Function) => void;
}

export interface IAsset {
	uuid: string;
	data: Blob;

	toString: (callback: Function) => void;
	getXmlObject: (callback: ToXMLObjectCallback) => void;
}

export interface IRenameNotepadObjectAction {
	internalRef: string;
	newName: string;
}
