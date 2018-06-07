import { INotepad } from './NotepadTypes';

export interface ISyncWorker {
	toSyncedNotepad: (notepad: INotepad) => Promise<ISyncedNotepad>;
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

export interface ISyncedNotepad extends INotepad {
	assetHashList: AssetList;
}
