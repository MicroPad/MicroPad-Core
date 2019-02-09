import { MicroPadReducer } from '../types/ReducerType';

export type NotepadPasskeysState = Record<string, string>;

export class NotepadPasskeysReducer extends MicroPadReducer<NotepadPasskeysState> {
	public readonly key = 'notepadPasskeys';
	public readonly initialState: NotepadPasskeysState = {};

	constructor() {
		super();
	}
}
