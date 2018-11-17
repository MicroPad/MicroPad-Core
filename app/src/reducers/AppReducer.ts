// @ts-ignore
import { version } from '../../package.json';

import { Action } from 'redux';
import { MicroPadReducer } from '../types/ReducerType';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { ThemeName } from '../types/Themes';
import { parse } from 'semver';

export interface IAppStoreState {
	version: IVersion;
	isFullScreen: boolean;
	defaultFontSize: string;
	zoom: number;
	showHelp: boolean;
	theme: ThemeName;
}

export interface IVersion {
	major: number;
	minor: number;
	patch: number;
	status: 'dev' | 'alpha' | 'beta' | 'stable';
}

const { major, minor, patch } = parse(version) || { major: 0, minor: 0, patch: 0 };

export class AppReducer extends MicroPadReducer<IAppStoreState> {
	public readonly key: string = 'app';
	public readonly initialState: IAppStoreState = {
		version: {
			major,
			minor,
			patch,
			status: 'beta'
		},
		isFullScreen: false,
		defaultFontSize: '16px',
		zoom: 1,
		showHelp: true,
		theme: 'Classic'
	};

	public reducer(state: IAppStoreState, action: Action): IAppStoreState {
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
