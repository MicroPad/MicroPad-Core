import { actions } from '../actions';
import { createSlice, SliceCaseReducers } from '@reduxjs/toolkit';

export type AppInfoState = {
	message?: AppInfoMessage,
	dismissed: boolean
};

export type AppInfoMessage = {
	text: string,
	cta?: string
};

export const appInfoSlice = createSlice<AppInfoState, SliceCaseReducers<AppInfoState>, 'appInfo'>({
	name: 'appInfo',
	initialState: { dismissed: false },
	reducers: {},
	extraReducers: builder => builder
		.addCase(actions.dismissInfoBanner, state => ({ ...state, dismissed: true }))
		.addCase(actions.setInfoMessage, (state, action) => ({
			...state,
			dismissed: state.message?.text === action.payload.text ? state.dismissed : false, // only re-show if new message
			message: action.payload
		}))
});
