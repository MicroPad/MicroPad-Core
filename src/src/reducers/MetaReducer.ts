import { IMetaStoreState } from '../types/MetaTypes';
import { Action } from 'redux';
import { IReducer } from '../types/ReducerType';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export class MetaReducer implements IReducer<IMetaStoreState> {
	public readonly key: string = 'meta';
	public readonly initialState: IMetaStoreState = {
		version: {
			major: 3,
			minor: 0,
			patch: 0,
			status: 'alpha'
		},
		isFullScreen: false,
		defaultFontSize: '16px'
	};

	public reducer(state: IMetaStoreState, action: Action): IMetaStoreState {
		if (isType(action, actions.flipFullScreenState)) {
			return {
				...state,
				isFullScreen: !state.isFullScreen
			};
		} else if (isType(action, actions.updateDefaultFontSize)) {
			return {
				...state,
				defaultFontSize: action.payload
			};
		}

		return state;
	}
}
