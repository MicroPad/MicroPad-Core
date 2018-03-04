import { IMetaStoreState } from './MetaTypes';
import { INotepadsStoreState, INoteStoreState } from './NotepadTypes';
import { IExplorerState } from '../reducers/ExplorerReducer';

export interface IStoreState {
	readonly meta: IMetaStoreState;
	readonly notepads: INotepadsStoreState;
	readonly currentNote: INoteStoreState;
	readonly explorer: IExplorerState;
}

export const APP_NAME = 'µPad';
export const SYNC_NAME = 'µSync';
export const MICROPAD_URL = 'https://getmicropad.com';
