import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';
import { DecryptionError } from '../services/CryptoService';

export type NotepadPasskeysState = Record<string, string>;

export class NotepadPasskeysReducer extends AbstractReducer<NotepadPasskeysState> {
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

		this.handle((state, action) => {
			if (!state[action.payload.params] || !(action.payload.error instanceof DecryptionError)) return state;
			const newState = { ...state };
			delete newState[action.payload.params];
			return newState;
		}, actions.openNotepadFromStorage.failed)
	}
}
