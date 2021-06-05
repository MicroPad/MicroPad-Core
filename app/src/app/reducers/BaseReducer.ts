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
import { IsExportingReducer } from './IsExportingReducer';
import { NotepadPasskeysReducer } from './NotepadPasskeysReducer';
import { MicroPadAction } from '../actions';
import { Action, Reducer } from 'redux';

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

interface ReduxReducer<S, A extends Action> {
	reducer: Reducer<S, A>
}

export class BaseReducer implements ReduxReducer<IStoreState, MicroPadAction> {
	public readonly initialState: IStoreState;
	public readonly key = '';

	constructor() {
		const initialState = {};
		REDUCERS.forEach(reducer => initialState[reducer.key] = reducer.initialState);
		this.initialState = Object.freeze(initialState as IStoreState);
	}

	public reducer(state: IStoreState | undefined, action: MicroPadAction): IStoreState {
		if (!state) {
			return this.initialState;
		}

		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = reducer.reducer(state[reducer.key], action));
		
		return isDev() ? deepFreeze(newState) : newState;
	}
}
