import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface IPrintStoreState {
	markdown: string;
}

export class PrintReducer implements IReducer<IPrintStoreState> {
	readonly key: string = 'print';
	readonly initialState: IPrintStoreState = {
		markdown: ''
	};

	public reducer(state: IPrintStoreState, action: Action): IPrintStoreState {
		if (isType(action, actions.print.done)) {
			return {
				...state,
				markdown: action.payload.result
			};
		}

		return state;
	}

}
