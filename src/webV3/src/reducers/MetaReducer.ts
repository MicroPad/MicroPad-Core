import { IStoreState } from '../types';
import { IMetaStoreState } from '../types/MetaTypes';
import { Action } from 'redux';
import { IReducer } from '../types/ReducerType';

export class MetaReducer implements IReducer {
	public key: string = 'meta';
	public readonly initialState: IMetaStoreState = {
		version: {
			major: 3,
			minor: 0,
			patch: 0,
			status: 'dev'
		}
	};

	public reducer(state: IStoreState, action: Action): IStoreState {
		let newState = {
			...state
		};

		return Object.freeze(newState);
	}
}
