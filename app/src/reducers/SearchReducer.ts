import { MicroPadReducer } from '../types/ReducerType';
import { Action } from 'redux';
import { isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { SearchIndices } from '../types/ActionTypes';

export interface ISearchState {
	hashTagResults: HashTagSearchResults;
	query: string;
	indices: SearchIndices;
}

export type HashTagSearchResult = {
	title: string;
	parentTitle: string;
	noteRef: string;
};

export type HashTagSearchResults = { [notepadTitle: string]: HashTagSearchResult[] };

export class SearchReducer extends MicroPadReducer<ISearchState> {
	public readonly key: string = 'search';
	public readonly initialState: ISearchState = {
		hashTagResults: {},
		query: '',
		indices: []
	};

	public reducer(state: ISearchState, action: Action): ISearchState {
		if (isType(action, actions.parseNpx.done) || isType(action, actions.parseNpx.failed) || isType(action, actions.deleteNotepad)) {
			return this.initialState;
		} else if (isType(action, actions.search)) {
			const query: string = action.payload;

			return {
				...state,
				query
			};
		} else if (isType(action, actions.displayHashTagSearchResults)) {
			return {
				...state,
				hashTagResults: action.payload
			};
		} else if (isType(action, actions.indexNotepads.done)) {
			return {
				...state,
				indices: action.payload.result
			};
		}

		return state;
	}
}
