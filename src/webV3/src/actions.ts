import actionCreatorFactory from 'redux-typescript-actions';
import { INote, INotepad, IRenameNotepadObjectAction, NoteElement } from './types/NotepadTypes';
import {
	IDeleteElementAction,
	IInsertElementAction,
	INewNotepadObjectAction,
	IUpdateBibliographyAction,
	IUpdateElementAction
} from './types/ActionTypes';
import { IInsertElementState } from './reducers/NoteReducer';

const actionCreator = actionCreatorFactory();

export const actions = {
	empty: actionCreator<void>('...'),

	parseNpx: actionCreator.async<string, INotepad, any>('PARSE_NPX'),
	saveNotepad: actionCreator.async<INotepad, void, any>('SAVE_NOTEPAD'),
	getNotepadList: actionCreator.async<void, string[], any>('GET_NOTEPAD_LIST'),
	downloadNotepad: actionCreator.async<string, string, any>('DOWNLOAD_NOTEPAD'),
	openNotepadFromStorage: actionCreator.async<string, void, any>('OPEN_NOTEPAD_FROM_STORAGE'),
	renameNotepad: actionCreator.async<string, string, any>('RENAME_NOTEPAD'),
	checkNoteAssets: actionCreator.async<[string, NoteElement[]], INotepad, any>('CHECK_NOTE_ASSETS'),
	loadNote: actionCreator.async<string, object, any>('LOAD_NOTE'),
	downloadAsset: actionCreator.async<{ filename: string, uuid: string }, void, any>('DOWNLOAD_ASSET'),
	expandAllExplorer: actionCreator.async<void, string[], any>('EXPAND_ALL_EXPLORER'),

	restoreJsonNotepad: actionCreator<string>('PARSE_JSON_NOTEPAD'),
	newNotepad: actionCreator<INotepad>('NEW_NOTEPAD'),
	flipFullScreenState: actionCreator<void>('FLIP_FULL_SCREEN'),
	deleteNotepad: actionCreator<string>('DELETE_NOTEPAD'),
	exportNotepad: actionCreator<void>('EXPORT_NOTEPAD'),
	exportAll: actionCreator<void>('EXPORT_ALL_NOTEPADS'),
	exportToMarkdown: actionCreator<void>('EXPORT_ALL_NOTEPADS_TO_MD'),
	expandSection: actionCreator<string>('OPEN_SECTION'),
	collapseSelection: actionCreator<string>('CLOSE_SECTION'),
	search: actionCreator<string>('SEARCH'),
	displayHashTagSearchResults: actionCreator<INote[]>('DISPLAY_HASH_TAG_SEARCH_RESULTS'),
	deleteNotepadObject: actionCreator<string>('DELETE_NOTEPAD_OBJECT'),
	renameNotepadObject: actionCreator<IRenameNotepadObjectAction>('RENAME_NOTEPAD_OBJECT'),
	expandFromNote: actionCreator<INote>('EXPAND_FROM_NOTE'),
	collapseAllExplorer: actionCreator<void>('COLLAPSE_ALL_EXPLORER'),
	openEditor: actionCreator<string>('OPEN_EDITOR'),
	updateElement: actionCreator<IUpdateElementAction>('UPDATE_ELEMENT'),
	updateDefaultFontSize: actionCreator<string>('UPDATE_DEFAULT_FONT_SIZE'),
	newSection: actionCreator<INewNotepadObjectAction>('NEW_SECTION'),
	newNote: actionCreator<INewNotepadObjectAction>('NEW_NOTE'),
	getHelp: actionCreator<void>('GET_HELP'),
	trackAsset: actionCreator<string>('TRACK_ASSET'),
	untrackAsset: actionCreator<string>('UNTRACK_ASSET'),
	reloadNote: actionCreator<void>('RELOAD_NOTE'),
	insertElement: actionCreator<IInsertElementAction>('INSERT_ELEMENT'),
	toggleInsertMenu: actionCreator<Partial<IInsertElementState>>('TOGGLE_INSERT_MENU'),
	deleteElement: actionCreator<IDeleteElementAction>('DELETE_ELEMENT'),
	queueParseNpx: actionCreator<string>('QUEUE_PARSE_NPX'),
	parseEnex: actionCreator<string>('PARSE_ENEX'),
	updateBibliography: actionCreator<IUpdateBibliographyAction>('UPDATE_BIBLIOGRAPHY')
};
