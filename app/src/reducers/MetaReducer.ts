import { IMetaStoreState } from '../types/MetaTypes';
import { Action } from 'redux';
import { MicroPadReducer } from '../types/ReducerType';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export class MetaReducer implements MicroPadReducer<IMetaStoreState> {
	public readonly key: string = 'meta';
	public readonly initialState: IMetaStoreState = {
		version: {
			major: 3,
			minor: 12,
			patch: 2,
			status: 'beta'
		},
		isFullScreen: false,
		defaultFontSize: '16px',
		zoom: 1,
		showHelp: true,
		theme: 'Classic'
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
		} else if (isType(action, actions.updateZoomLevel)) {
			let zoom = state.zoom + action.payload;
			if (zoom > 1.5) zoom = 1.51;
			if (zoom <= 0) zoom = 0.09;

			return {
				...state,
				zoom
			};
		} else if (isType(action, actions.openEditor)) {
			if (!action.payload.includes('drawing')) return state;

			return {
				...state,
				zoom: this.initialState.zoom
			};
		} else if (isType(action, actions.setHelpPref)) {
			return {
				...state,
				showHelp: action.payload
			};
		} else if (isType(action, actions.selectTheme)) {
			return {
				...state,
				theme: action.payload
			};
		}

		return state;
	}
}
