import { IReducer } from '../types/ReducerType';
import { IStoreState } from '../types/index';
import { MetaReducer } from './MetaReducer';
import { Action } from 'redux';

export const REDUCERS: Array<IReducer> = [
	new MetaReducer()
];

export class BaseReducer implements IReducer {
	public initialState: IStoreState;
	public key: string = '';

	constructor() {
		const initialState = {};
		REDUCERS.forEach(reducer => initialState[reducer.key] = reducer.initialState);
		this.initialState = Object.freeze(initialState as IStoreState);
	}

	public reducer(state: IStoreState, action: Action): IStoreState {
		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = reducer.reducer(state[reducer.key], action));

		return Object.freeze(newState);
	}
}
