import { Notepad } from 'upad-parse/dist';

export type SyncLoginRequest = {
	username: string;
	password: string;
	captcha?: string;
};

export type SyncUser = {
	username: string;
	token: string;
};

export type AssetList = { [uuid: string]: string };

export type SyncedNotepadList = { [title: string]: string }; // title -> uuid

export interface INotepadSharingData {
	title: string;
	notepad: string;
	owner: string;
	collaborators?: string[];
	scribe?: string;
}

export type CombinedNotepadSyncList = Record<string, INotepadSharingData>;

export interface ISyncedNotepad extends Notepad {
	assetHashList: { [uuid: string]: number };
}
