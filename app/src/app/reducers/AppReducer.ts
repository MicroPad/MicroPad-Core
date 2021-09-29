// @ts-ignore
import { version } from '../../../package.json';

import { Action } from 'redux';
import { MicroPadReducer } from '../types/ReducerType';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { ThemeName } from '../types/Themes';
import { parse } from 'semver';
import { isDev } from '../util';
import { ZoomChange } from '../types/ActionTypes';
import { ThemeValues } from '../ThemeValues';

export interface IAppStoreState {
	version: IVersion;
	isFullScreen: boolean;
	defaultFontSize: string;
	zoom: number;
	showHelp: boolean;
	theme: ThemeName;
	explorerWidth: string;
}

export interface IVersion {
	major: number;
	minor: number;
	patch: number;
	status: 'dev' | 'alpha' | 'beta' | 'stable';
}

const { major, minor, patch } = parse(version) || { major: 0, minor: 0, patch: 0 };

export class AppReducer extends MicroPadReducer<IAppStoreState> {
	public readonly key = 'app';
	public readonly initialState: IAppStoreState = {
		version: {
			major,
			minor,
			patch,
			status: isDev() ? 'dev' : 'stable'
		},
		isFullScreen: false,
		defaultFontSize: '16px',
		zoom: 1,
		showHelp: true,
		theme: 'Classic',
		explorerWidth: '280px'
	};

	public reducer(state: IAppStoreState, action: Action): IAppStoreState {
		if (isType(action, actions.flipFullScreenState)) {
			const zoom = state.isFullScreen ? this.initialState.zoom : state.zoom;

			return {
				...state,
				isFullScreen: !state.isFullScreen,
				zoom
			};
		} else if (isType(action, actions.exitFullScreen)) {
			return {
				...state,
				isFullScreen: false
			};
		} else if (isType(action, actions.updateDefaultFontSize)) {
			return {
				...state,
				defaultFontSize: action.payload
			};
		} else if (isType(action, actions.updateZoomLevel)) {
			switch (action.payload) {
				case ZoomChange.INCREASE:
					return { ...state, zoom: state.zoom * 1.1 };

				case ZoomChange.DECREASE:
					return { ...state, zoom: state.zoom * 0.9 };

				default:
					throw new Error(`Invalid ZoomChange`);
			}
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
			const themeName = action.payload;
			return {
				...state,
				theme: ThemeValues[themeName] ? action.payload : 'Classic'
			};
		} else if (isType(action, actions.setExplorerWidth)) {
			return {
				...state,
				explorerWidth: action.payload
			};
		}

		return state;
	}
}
