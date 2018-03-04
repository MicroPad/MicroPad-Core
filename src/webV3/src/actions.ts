import actionCreatorFactory from 'redux-typescript-actions';
import { INote, INotepad } from './types/NotepadTypes';

const actionCreator = actionCreatorFactory();

export const actions = {
	empty: actionCreator<void>('...'),

	parseNpx: actionCreator.async<string, INotepad, any>('PARSE_NPX'),
	saveNotepad: actionCreator.async<INotepad, void, any>('SAVE_NOTEPAD'),
	getNotepadList: actionCreator.async<void, string[], any>('GET_NOTEPAD_LIST'),
	getHelp: actionCreator.async<void, string, any>('GET_HELP'),
	openNotepadFromStorage: actionCreator.async<string, void, any>('OPEN_NOTEPAD_FROM_STORAGE'),

	restoreJsonNotepad: actionCreator<string>('PARSE_JSON_NOTEPAD'),
	newNotepad: actionCreator<INotepad>('NEW_NOTEPAD'),
	flipFullScreenState: actionCreator<void>('FLIP_FULL_SCREEN'),
	deleteNotepad: actionCreator<string>('DELETE_NOTEPAD'),
	exportNotepad: actionCreator<void>('EXPORT_NOTEPAD'),
	renameNotepad: actionCreator<string>('RENAME_NOTEPAD'),
	exportAll: actionCreator<void>('EXPORT_ALL_NOTEPADS'),
	loadNote: actionCreator<INote>('LOAD_NOTE'),
	expandSection: actionCreator<string>('OPEN_SECTION'),
	collapseSelection: actionCreator<string>('CLOSE_SECTION'),
	search: actionCreator<string>('SEARCH'),
	displayHashTagSearchResults: actionCreator<INote[]>('DISPLAY_HASH_TAG_SEARCH_RESULTS')
};
