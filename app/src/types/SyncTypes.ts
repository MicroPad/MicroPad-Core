import { INotepad } from './NotepadTypes';

export interface ISyncWorker {
	// getSyncedNotepad()
}

export type SyncLoginRequest = {
	username: string;
	password: string;
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
