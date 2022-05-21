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
import { Action, Reducer, ReducersMapObject } from 'redux';
import { isReadOnlyNotebook } from '../ReadOnly';
import deepFreeze from 'deep-freeze';
import { appInfoSlice } from './AppInfoReducer';
import { editorSlice } from './EditorReducer';
import { combineReducers } from '@reduxjs/toolkit';

interface ReduxReducer<S, A extends Action> {
	reducer: Reducer<S, A>
}

const REDUCERS: Reducer<IStoreState, MicroPadAction> = (() => {
	const reducers: ReducersMapObject<IStoreState, MicroPadAction> = {
		/* Legacy reducers */
		app: new AppReducer().reducer,
		currentNote: new NoteReducer().reducer,
		explorer: new ExplorerReducer().reducer,
		isExporting: new IsExportingReducer().reducer,
		notepadPasskeys: new NotepadPasskeysReducer().reducer,
		notepads: new NotepadsReducer().reducer,
		print: new PrintReducer().reducer,
		search: new SearchReducer().reducer,
		sync: new SyncReducer().reducer,
		/* New reducers */
		[editorSlice.name]: editorSlice.reducer,
		[appInfoSlice.name]: appInfoSlice.reducer
	};

	return combineReducers(reducers);
})();

export class BaseReducer implements ReduxReducer<IStoreState, MicroPadAction> {
	public reducer = (state: IStoreState | undefined, action: MicroPadAction): IStoreState => {
		if (BaseReducer.isReadonlyViolation(state, action)) {
			// Skip any state updates if we're in a readonly notebook
			return state!;
		}

		const newState = REDUCERS(state, action);
		return isDev() ? deepFreeze(newState) as IStoreState : newState;
	}

	private static isReadonlyViolation(state: IStoreState | undefined, action: MicroPadAction): boolean {
		if (!state) return false;
		if (!isReadOnlyNotebook(state.notepads?.notepad?.item?.title ?? '')) {
			return false;
		}

		return READ_ONLY_ACTIONS.has(action.type);
	}
}
