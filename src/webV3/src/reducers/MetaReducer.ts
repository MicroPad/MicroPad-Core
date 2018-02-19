import { IMetaStoreState } from '../types/MetaTypes';
import { Action } from 'redux';
import { IReducer } from '../types/ReducerType';

export class MetaReducer implements IReducer<IMetaStoreState> {
	public readonly key: string = 'meta';
	public readonly initialState: IMetaStoreState = {
		version: {
			major: 3,
			minor: 0,
			patch: 0,
			status: 'dev'
		}
	};

	public reducer(state: IMetaStoreState, action: Action): IMetaStoreState {
		return Object.freeze(state);
	}
}
