import { MicroPadReducer } from '../types/ReducerType';
import { IStoreState } from '../types';
import * as deepFreeze from 'deep-freeze';
import { isDev } from '../../react-web/util';
import { Action } from 'redux-typescript-actions';
import { NotepadsReducer } from './NotepadsReducer';
import { NoteReducer } from './NoteReducer';
import { ExplorerReducer } from './ExplorerReducer';
import { SearchReducer } from './SearchReducer';
import { PrintReducer } from './PrintReducer';
import { SyncReducer } from './SyncReducer';
import { AppReducer } from './AppReducer';
import { IsExportingReducer } from './IsExportingReducer';
import { NotepadPasskeysReducer } from './NotepadPasskeysReducer';

export const REDUCERS: Array<MicroPadReducer<any>> = [
	new AppReducer(),
	new NotepadPasskeysReducer(),
	new NotepadsReducer(),
	new NoteReducer(),
	new ExplorerReducer(),
	new SearchReducer(),
	new PrintReducer(),
	new SyncReducer(),
	new IsExportingReducer()
];

export class BaseReducer {
	public readonly initialState: IStoreState;
	public readonly key = '';

	constructor() {
		const initialState = {};
		REDUCERS.forEach(reducer => initialState[reducer.key] = reducer.initialState);
		this.initialState = Object.freeze(initialState as IStoreState);
	}

	public reducer = (inputState: IStoreState | undefined, action: Action<any>): IStoreState => {
		const state = inputState || this.initialState;

		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = Object.freeze(reducer.reducer(Object.freeze(state[reducer.key]), action)));

		return (!isDev) ? Object.freeze(newState) : deepFreeze(newState);
	}
}
