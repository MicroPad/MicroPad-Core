import { actions } from '../actions';
import { createSlice, SliceCaseReducers } from '@reduxjs/toolkit';

export type EditorState = {
	shouldSpellCheck: boolean,
	shouldWordWrap: boolean,
	drawMode: DrawMode,
	drawingLineColour: string
};

export const enum DrawMode {
	Line = 'line',
	ERASE = 'erase',
	RAINBOW = 'rainbow'
}

export const editorSlice = createSlice<EditorState, SliceCaseReducers<EditorState>, 'editor'>({
	name: 'editor',
	initialState: {
		shouldSpellCheck: true,
		shouldWordWrap: true,
		drawMode: DrawMode.Line,
		drawingLineColour: '#000000'
	},
	reducers: {},
	extraReducers: builder => builder
		.addCase(actions.toggleSpellCheck, (state, action) => ({
			...state,
			shouldSpellCheck: action.payload ?? !state.shouldSpellCheck
		}))
		.addCase(actions.toggleWordWrap, (state, action) => ({
			...state,
			shouldWordWrap: action.payload ?? !state.shouldWordWrap
		}))
		.addCase(actions.setDrawMode, (state, { payload }) => ({ ...state, drawMode: payload }))
		.addCase(actions.setDrawingLineColour, (state, { payload }) => ({
			...state,
			drawingLineColour: payload,
			drawMode: DrawMode.Line
		}))
});
