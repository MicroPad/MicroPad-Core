import { MicroPadReducer } from '../types/ReducerType';
import { actions } from '../actions';

export type NotepadPasskeysState = Record<string, string>;

export class NotepadPasskeysReducer extends MicroPadReducer<NotepadPasskeysState> {
	public readonly key = 'notepadPasskeys';
	public readonly initialState: NotepadPasskeysState = {};

	constructor() {
		super();

		this.handle((state, action) => {
			if (!action.payload.notepadTitle) return state;

			return {
				...state,
				[action.payload.notepadTitle]: action.payload.passkey
			};
		}, actions.addCryptoPasskey);
	}
}
