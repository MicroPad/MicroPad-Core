import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';
import { RestoreJsonNotepadAndLoadNoteAction, SearchIndices } from '../types/ActionTypes';
import { ElementSearchResult } from '../services/NoteSearch';

export interface ISearchState {
	query: string;
	results: SearchResults;
	elementResults: ElementSearchResult[];
	indices: SearchIndices;
	shouldShowResults: boolean;
}

export type SearchResult = {
	title: string;
	parentTitle: string;
	noteRef: string;
};

export type SearchResults = { [notepadTitle: string]: SearchResult[] };

export type SearchResultsPayload = {
	noteResults: SearchResults;
	elementResults: ElementSearchResult[];
};

export class SearchReducer extends AbstractReducer<ISearchState> {
	public readonly key = 'search';
	public readonly initialState: ISearchState = {
		results: {},
		elementResults: [],
		query: '',
		indices: [],
		shouldShowResults: false
	};

	constructor() {
		super();

		// Reset state on notepad close/update
		this.handleMany(() => this.initialState, actions.parseNpx.done, actions.parseNpx.failed, actions.deleteNotepad);

		// Search query/results
		this.handle(
			(state, action) => ({ ...state, query: action.payload }),
			actions.search.started
		);
		this.handle((state, action) => ({
			...state,
			results: action.payload.result.noteResults,
			elementResults: action.payload.result.elementResults
		}), actions.search.done);

		this.handle((state, action) => ({
			...state,
			shouldShowResults: action.payload
		}), actions.setSearchResultVisibility);


		this.handleMemo((state, action) => ({
			...state,
			indices: action.payload.result
		}), actions.indexNotepads.done);

		this.handleMany(state => ({
			...state,
			query: this.initialState.query,
			results: this.initialState.results,
			elementResults: this.initialState.elementResults
		}), actions.loadNote.started, actions.restoreJsonNotepadAndLoadNote, actions.jumpToNoteElement)
	}


}
