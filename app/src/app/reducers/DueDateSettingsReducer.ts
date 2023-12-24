import { createSlice, SliceCaseReducers } from '@reduxjs/toolkit';
import { actions } from '../actions';

export type DueDateSettingsState = {
	showHistoricalDueDates: boolean | null,
};

export const dueDateSettingsSlice = createSlice<DueDateSettingsState, SliceCaseReducers<DueDateSettingsState>, 'dueDateSettings'>({
	name: 'dueDateSettings',
	initialState: {
		showHistoricalDueDates: null,
	},
	reducers: {},
	extraReducers: builder => builder
		.addCase(actions.setShowHistoricalDueDates, (state, action) => ({
			...state,
			showHistoricalDueDates: action.payload
		}))
});