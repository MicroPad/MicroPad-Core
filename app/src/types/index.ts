import { IMetaStoreState } from './MetaTypes';
import { INotepadsStoreState } from './NotepadTypes';
import { IExplorerState } from '../reducers/ExplorerReducer';
import { ISearchState } from '../reducers/SearchReducer';
import { ICurrentNoteState } from '../reducers/NoteReducer';
import { IPrintStoreState } from '../reducers/PrintReducer';
import { ISyncState } from '../reducers/SyncReducer';

export interface IStoreState {
	readonly meta: IMetaStoreState;
	readonly notepads: INotepadsStoreState;
	readonly currentNote: ICurrentNoteState;
	readonly explorer: IExplorerState;
	readonly search: ISearchState;
	readonly print: IPrintStoreState;
	readonly sync: ISyncState;
}

export const APP_NAME = 'µPad';
export const SYNC_NAME = 'µSync';
export const MICROPAD_URL = 'https://getmicropad.com';
export const UNSUPPORTED_MESSAGE = 'Support for this type of content was removed in v3. You can go to https://getmicropad.com/web to access v2.';
export const BAD_BROWSER_AUDIO = `If your web browser doesn't support this type of audio you can click here to download it.`;
