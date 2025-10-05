import { actions } from '../actions';
import { createSlice, SliceCaseReducers } from '@reduxjs/toolkit';

export const enum DrawMode {
  Line = 'line',
  ERASE = 'erase',
  RAINBOW = 'rainbow',
}

export type EditorState = {
  shouldSpellCheck: boolean;
  shouldWordWrap: boolean;
  drawMode: DrawMode;
  drawingLineColour: string;
  drawings: any[];
  past: any[];
  future: any[];
};

export const editorSlice = createSlice<EditorState, SliceCaseReducers<EditorState>, 'editor'>({
  name: 'editor',
  initialState: {
    shouldSpellCheck: true,
    shouldWordWrap: true,
    drawMode: DrawMode.Line,
    drawingLineColour: '#000000',
    drawings: [],
    past: [],
    future: [],
  },
  reducers: {},
  extraReducers: builder => builder
    .addCase(actions.toggleSpellCheck, (state, action) => {
      state.shouldSpellCheck = action.payload ?? !state.shouldSpellCheck;
    })
    .addCase(actions.toggleWordWrap, (state, action) => {
      state.shouldWordWrap = action.payload ?? !state.shouldWordWrap;
    })
    .addCase(actions.setDrawMode, (state, { payload }) => {
      state.drawMode = payload;
    })
    .addCase(actions.setDrawingLineColour, (state, { payload }) => {
      state.drawingLineColour = payload;
      state.drawMode = DrawMode.Line;
    })
    .addCase(actions.addDrawing, (state, { payload }) => {
      state.past.push([...state.drawings]); // push current drawings to past
      state.future = [];
      state.drawings.push(payload);
    })
    .addCase(actions.undoDrawing, (state) => {
      if (state.past.length === 0) return;
      const previous = state.past.pop()!;
      state.future.unshift([...state.drawings]);
      state.drawings = previous;
    })
    .addCase(actions.redoDrawing, (state) => {
      if (state.future.length === 0) return;
      const next = state.future.shift()!;
      state.past.push([...state.drawings]);
      state.drawings = next;
    }),
});
