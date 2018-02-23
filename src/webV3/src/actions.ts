import actionCreatorFactory from 'redux-typescript-actions';
import { INotepad } from './types/NotepadTypes';

const actionCreator = actionCreatorFactory();

export const actions = {
	parseNpx: actionCreator.async<string, INotepad, any>('PARSE_NPX'),
	saveNotepad: actionCreator.async<INotepad, void, any>('SAVE_NOTEPAD'),
	getNotepadList: actionCreator.async<void, string[], any>('GET_NOTEPAD_LIST'),
	getHelp: actionCreator.async<void, string, any>('GET_HELP'),
	openNotepadFromStorage: actionCreator.async<string, void, any>('OPEN_NOTEPAD_FROM_STORAGE'),
	restoreJsonNotepad: actionCreator<string>('PARSE_JSON_NOTEPAD')
};
