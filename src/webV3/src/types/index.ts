import { IMetaStoreState } from './MetaTypes';
import { INotepadsStoreState } from './NotepadTypes';

export interface IStoreState {
	readonly meta: IMetaStoreState;
	readonly notepads: INotepadsStoreState;
}

export const APP_NAME = 'µPad';
export const SYNC_NAME = 'µSync';
