import actionCreatorFactory, { AsyncActionCreators } from 'redux-typescript-actions';
import { INotepad } from './types/NotepadTypes';

const actionCreator = actionCreatorFactory();

export const actions: { [name: string]: AsyncActionCreators<any, any, any> } = {
	parseNpx: actionCreator.async<string, INotepad, any>('PARSE_NPX'),
	saveNotepad: actionCreator.async<void, void, any>('SAVE_NOTEPAD'),
	getNotepadList: actionCreator.async<void, string[], any>('GET_NOTEPAD_LIST')
};

export const emptyAction = actionCreator<any>('EMPTY');
