import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';
import { NoteElement } from 'upad-parse/dist/Note';

export interface IPrintStoreState {
	elementToPrint?: NoteElement;
}

export class PrintReducer extends AbstractReducer<IPrintStoreState> {
	readonly key = 'print';
	readonly initialState: IPrintStoreState = {};

	constructor() {
		super();

		this.handle((state, action) => ({
			...state,
			elementToPrint: action.payload.result
		}), actions.print.done);

		this.handle(() => ({ ...this.initialState }), actions.clearPrintView);
	}
}
