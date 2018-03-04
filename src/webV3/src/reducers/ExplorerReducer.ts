import { IReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';

export interface IExplorerState {
	openSections: string[];
}

export class ExplorerReducer implements IReducer<IExplorerState> {
	public readonly key: string = 'explorer';
	public readonly initialState: IExplorerState = {
		openSections: []
	};

	public reducer(state: IExplorerState, action: Action): IExplorerState {
		if (isType(action, actions.expandSection)) {
			const guid: string = action.payload;

			return {
				openSections: [
					...state.openSections,
					guid
				]
			};
		} else if (isType(action, actions.collapseSelection)) {
			const guidToClose: string = action.payload;

			return {
				openSections: state.openSections.filter((guid: string) => guid !== guidToClose)
			};
		}

		return state;
	}
}
