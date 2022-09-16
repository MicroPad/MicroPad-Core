import { actions, MicroPadAction } from '../actions';
import { createSlice, SliceCaseReducers } from '@reduxjs/toolkit';
import { DOWNLOAD_NOTEBOOK_MESSAGE } from '../strings.enNZ';

export type AppInfoState = {
	message?: AppInfoMessage,
	dismissed: boolean
};

export type AppInfoMessage = {
	text: string,
	cta?: string,
	localButton?: {
		title: string,
		action: (dispatch: (action: MicroPadAction) => void) => void,
	},
};

export const appInfoSlice = createSlice<AppInfoState, SliceCaseReducers<AppInfoState>, 'appInfo'>({
	name: 'appInfo',
	initialState: { dismissed: false },
	reducers: {},
	extraReducers: builder => builder
		.addCase(actions.dismissInfoBanner, state => ({ ...state, dismissed: true }))
		.addCase(actions.setInfoMessage, (state, action) => ({
			dismissed: state.message?.text === action.payload.text && action.payload.text !== DOWNLOAD_NOTEBOOK_MESSAGE ? state.dismissed : false, // only re-show if new message
			message: action.payload
		}))
});
