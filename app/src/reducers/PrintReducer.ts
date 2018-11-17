import { MicroPadReducer } from '../types/ReducerType';
import { actions } from '../actions';
import { NoteElement } from 'upad-parse/dist/Note';

export interface IPrintStoreState {
	elementToPrint?: NoteElement;
}

export class PrintReducer extends MicroPadReducer<IPrintStoreState> {
	readonly key: string = 'print';
	readonly initialState: IPrintStoreState = {};

	constructor() {
		super();

		this.handle(actions.print.done, (state, action) => {
			return {
				...state,
				elementToPrint: action.payload.result
			};
		});

		this.handle(actions.clearPrintView, () => {
			return { ...this.initialState };
		});
	}
}
