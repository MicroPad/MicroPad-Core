import { connect } from 'react-redux';
import SearchComponent from './SearchComponent';
import { IStoreState } from '../../types';
import { Dispatch } from 'redux';
import { actions, MicroPadAction } from '../../actions';
import { RestoreJsonNotepadAndLoadNoteAction } from '../../types/ActionTypes';

export const searchConnector = connect(
	({ search, notepads }: IStoreState) => {
		return {
			notepad: notepads.notepad?.item,
			query: search.query,
			results: search.results,
			elementResults: search.elementResults,
			showResults: search.shouldShowResults
		};
	},
	(dispatch: Dispatch<MicroPadAction>) => ({
		search: (query: string) => dispatch(actions.search.started(query)),
		loadResult: (currentNotepadTitle: string | undefined, result: RestoreJsonNotepadAndLoadNoteAction) => {
			if (currentNotepadTitle === result.notepadTitle) {
				dispatch(actions.loadNote.started(result.noteRef));
			} else {
				dispatch(actions.restoreJsonNotepadAndLoadNote(result));
			}
		},
		jumpToElement: (elementId: string) => dispatch(actions.jumpToNoteElement(elementId)),
		setSearchResultVisibility: (visibility: boolean) => dispatch(actions.setSearchResultVisibility(visibility))
	})
);

export default searchConnector(SearchComponent);
