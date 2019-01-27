import { MicroPadReducer } from '../types/ReducerType';
import { actions } from '../../react-web/actions';
import { NoteElement } from 'upad-parse/dist/Note';

export interface IPrintStoreState {
	elementToPrint?: NoteElement;
}

export class PrintReducer extends MicroPadReducer<IPrintStoreState> {
	readonly key = 'print';
	readonly initialState: IPrintStoreState = {};

	constructor() {
		super();

		this.handle((state, action) => {
			return {
				...state,
				elementToPrint: action.payload.result
			};
		}, actions.print.done);

		this.handle(() => {
			return { ...this.initialState };
		}, actions.clearPrintView);
	}
}
