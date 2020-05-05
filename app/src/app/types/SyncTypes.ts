import { Notepad } from 'upad-parse/dist';

export interface ISyncWorker {
	getAssetInfo(notepad: Notepad): Promise<{ assets: Record<string, ArrayBuffer>, notepadAssets: string[] }>;
}

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
	assetHashList: AssetList;
}
