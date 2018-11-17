import { MicroPadReducer } from '../types/ReducerType';
import { IStoreState } from '../types';
import * as deepFreeze from 'deep-freeze';
import { isDev } from '../util';
import { NotepadsReducer } from './NotepadsReducer';
import { NoteReducer } from './NoteReducer';
import { ExplorerReducer } from './ExplorerReducer';
import { SearchReducer } from './SearchReducer';
import { PrintReducer } from './PrintReducer';
import { SyncReducer } from './SyncReducer';
import { AppReducer } from './AppReducer';
import { Action } from 'redux-typescript-actions';

export const REDUCERS: Array<MicroPadReducer<any>> = [
	new AppReducer(),
	new NotepadsReducer(),
	new NoteReducer(),
	new ExplorerReducer(),
	new SearchReducer(),
	new PrintReducer(),
	new SyncReducer()
];

export class BaseReducer extends MicroPadReducer<IStoreState> {
	public readonly initialState: IStoreState;
	public readonly key: string = '';

	constructor() {
		super();

		const initialState = {};
		REDUCERS.forEach(reducer => initialState[reducer.key] = reducer.initialState);
		this.initialState = Object.freeze(initialState as IStoreState);
	}

	public reducer(state: IStoreState, action: Action<any>): IStoreState {
		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = Object.freeze(reducer.reducer(Object.freeze(state[reducer.key]), action)));
		
		return (!isDev) ? Object.freeze(newState) : deepFreeze(newState);
	}
}
