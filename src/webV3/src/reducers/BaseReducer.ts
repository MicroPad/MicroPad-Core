import { IReducer } from '../types/ReducerType';
import { IStoreState } from '../types/index';
import { MetaReducer } from './MetaReducer';
import { Action } from 'redux';
import { NotepadsReducer } from './NotepadsReducer';
import { NoteReducer } from './NoteReducer';
import { ExplorerReducer } from './ExplorerReducer';
import { SearchReducer } from './SearchReducer';

export const REDUCERS: Array<IReducer<any>> = [
	new MetaReducer(),
	new NoteReducer(),
	new NotepadsReducer(),
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

		return Object.freeze(newState);
	}
}
