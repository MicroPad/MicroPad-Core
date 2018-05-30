import { INotepad } from './NotepadTypes';

export type SyncUser = { username: string; token: string; };

export type AssetList = { [uuid: string]: string };

export type SyncedNotepadListResponse = { [uuid: string]: string }; // uuid -> title
export type SyncedNotepadList = { [title: string]: string }; // title -> uuid

export type SyncedNotepadInfo = {
	title: string;
	lastModified: string;
};

export interface ISyncedNotepad extends INotepad {
	assetHashList: AssetList;
}
