import { IReducer } from '../types/ReducerType';
import { IStoreState } from '../types';
import { MetaReducer } from './MetaReducer';
import { Action } from 'redux';
import { NotepadsReducer } from './NotepadsReducer';
import { NoteReducer } from './NoteReducer';
import { ExplorerReducer } from './ExplorerReducer';
import { SearchReducer } from './SearchReducer';
import * as deepFreeze from 'deep-freeze';
import { isDev } from '../util';

export const REDUCERS: Array<IReducer<any>> = [
	new MetaReducer(),
	new NotepadsReducer(),
	new NoteReducer(),
	new ExplorerReducer(),
	new SearchReducer()
];

export class BaseReducer implements IReducer<IStoreState> {
	public readonly initialState: IStoreState;
	public readonly key: string = '';

	constructor() {
		const initialState = {};
		REDUCERS.forEach(reducer => initialState[reducer.key] = reducer.initialState);
		this.initialState = Object.freeze(initialState as IStoreState);
	}

	public reducer(state: IStoreState, action: Action): IStoreState {
		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = Object.freeze(reducer.reducer(Object.freeze(state[reducer.key]), action)));
		
		return (!isDev) ? Object.freeze(newState) : deepFreeze(newState);
	}
}
