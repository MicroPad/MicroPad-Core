import { MicroPadReducer } from '../types/ReducerType';
import { actions } from '../actions';

export type EditorState = {
	shouldSpellCheck: boolean,
	shouldWordWrap: boolean
};

export class EditorReducer extends MicroPadReducer<EditorState> {
	public readonly key = 'editor';
	public readonly initialState: EditorState = {
		shouldSpellCheck: true,
		shouldWordWrap: true
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
	}
}