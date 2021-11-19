import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';

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

export class EditorReducer extends AbstractReducer<EditorState> {
	public readonly key = 'editor';
	public readonly initialState: EditorState = {
		shouldSpellCheck: true,
		shouldWordWrap: true,
		drawMode: DrawMode.Line,
		drawingLineColour: '#000'
	};

	constructor() {
		super();

		this.handle(
			(state, action) => ({
				...state,
				shouldSpellCheck: action.payload ?? !state.shouldSpellCheck
			}),
			actions.toggleSpellCheck
		);

		this.handle(
			(state, action) => ({
				...state,
				shouldWordWrap: action.payload ?? !state.shouldWordWrap
			}),
			actions.toggleWordWrap
		);

		this.handle((state, { payload }) => ({ ...state, drawMode: payload }), actions.setDrawMode);
	}
}
