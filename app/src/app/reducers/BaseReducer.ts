import { MicroPadReducer } from '../types/ReducerType';
import { IStoreState } from '../types';
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
import { MicroPadAction, READ_ONLY_ACTIONS } from '../actions';
import { Action, Reducer } from 'redux';
import { isReadOnlyNotebook } from '../ReadOnly';
import deepFreeze from 'deep-freeze';

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
			state = this.initialState;
		}

		if (BaseReducer.isReadonlyViolation(state, action)) {
			// Skip any state updates if we're in a readonly notebook
			return state;
		}

		let newState = {
			...state
		};
		REDUCERS.forEach(reducer => newState[reducer.key] = reducer.reducer(state![reducer.key], action));
		
		return isDev() ? deepFreeze(newState) as IStoreState : newState;
	}

	private static isReadonlyViolation(state: IStoreState, action: MicroPadAction): boolean {
		if (!isReadOnlyNotebook(state.notepads?.notepad?.item?.title ?? '')) {
			return false;
		}

		return READ_ONLY_ACTIONS.has(action.type);
	}
}
