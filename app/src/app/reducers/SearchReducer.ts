import { MicroPadReducer } from '../types/ReducerType';
import { actions } from '../actions';
import { SearchIndices } from '../types/ActionTypes';

export interface ISearchState {
	query: string;
	results: SearchResults;
	indices: SearchIndices;
	shouldShowResults: boolean;
}

export type SearchResult = {
	title: string;
	parentTitle: string;
	noteRef: string;
};

export type SearchResults = { [notepadTitle: string]: SearchResult[] };

export class SearchReducer extends MicroPadReducer<ISearchState> {
	public readonly key = 'search';
	public readonly initialState: ISearchState = {
		results: {},
		query: '',
		indices: [],
		shouldShowResults: false
	};

	constructor() {
		super();

		// Reset state on notepad close/update
		this.handle<any>(() => this.initialState, actions.parseNpx.done, actions.parseNpx.failed, actions.deleteNotepad);

		// Search query/results
		this.handle(
			(state, action) => ({ ...state, query: action.payload }),
			actions.search.started
		);
		this.handle((state, action) => ({
			...state,
			results: action.payload.result
		}), actions.search.done);

		this.handle((state, action) => ({
			...state,
			shouldShowResults: action.payload
		}), actions.setSearchResultVisibility);


		this.handleMemo((state, action) => ({
			...state,
			indices: action.payload.result
		}), actions.indexNotepads.done);

		this.handle<any>(state => ({
			...state,
			query: this.initialState.query,
			results: this.initialState.results
		}), actions.loadNote.started, actions.restoreJsonNotepadAndLoadNote)
	}


}
