import actionCreatorFactory, { AsyncActionCreators } from 'redux-typescript-actions';
import { INotepad } from './types/NotepadTypes';

const actionCreator = actionCreatorFactory();

export const actions: { [name: string]: AsyncActionCreators<any, any, any> } = {
	parseNpx: actionCreator.async<string, INotepad, void>('PARSE_NPX'),
	saveNotepad: actionCreator.async<void, void, void>('SAVE_NOTEPAD')
};
