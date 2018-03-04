import { IMetaStoreState } from './MetaTypes';
import { INotepadsStoreState, INoteStoreState } from './NotepadTypes';
import { IExplorerState } from '../reducers/ExplorerReducer';
import { ISearchState } from '../reducers/SearchReducer';

export interface IStoreState {
	readonly meta: IMetaStoreState;
	readonly notepads: INotepadsStoreState;
	readonly currentNote: INoteStoreState;
	readonly explorer: IExplorerState;
	readonly search: ISearchState;
}

export const APP_NAME = 'µPad';
export const SYNC_NAME = 'µSync';
export const MICROPAD_URL = 'https://getmicropad.com';
