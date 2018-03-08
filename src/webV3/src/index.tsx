import 'material-icons-font/material-icons-font.css';
import 'materialize-css/dist/css/materialize.min.css';
import 'jquery/dist/jquery.slim.js';
import 'materialize-css/dist/js/materialize.js';
import * as React from 'react';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { IStoreState, MICROPAD_URL } from './types';
import { applyMiddleware, createStore } from 'redux';
import { BaseReducer } from './reducers/BaseReducer';
import { epicMiddleware } from './epics';
import { composeWithDevTools } from 'redux-devtools-extension';
import * as localforage from 'localforage';
import * as ReactDOM from 'react-dom';
import { actions } from './actions';
import { Provider } from 'react-redux';
import HeaderComponent from './containers/header/HeaderContainer';
import { from } from 'rxjs/observable/from';
import { debounceTime, distinctUntilChanged, filter, map, withLatestFrom } from 'rxjs/operators';
import { INote, INotepad, INotepadStoreState } from './types/NotepadTypes';
import NotepadExplorerComponent from './containers/NotepadExplorerContainer';
import NoteViewerComponent from './components/note-viewer/NoteViewerComponent';
import { getNotepadObjectByRef } from './util';

try {
	document.domain = MICROPAD_URL.split('//')[1];
} catch (err) {
	console.warn(`Couldn't set domain for resolving CORS. If this is prod change 'MICROPAD_URL'.`);
}

const baseReducer: BaseReducer = new BaseReducer();
export const store = createStore<IStoreState>(
	baseReducer.reducer,
	baseReducer.initialState,
	composeWithDevTools(applyMiddleware(epicMiddleware)));
export const state$ = from(store as any);

export const NOTEPAD_STORAGE = localforage.createInstance({
	name: 'MicroPad',
	storeName: 'notepads'
});
export const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
});

Promise.all([NOTEPAD_STORAGE.ready(), ASSET_STORAGE.ready()])
	.then(() => store.dispatch(actions.getNotepadList.started(undefined)))
	.then(() => ReactDOM.render(
		<Provider store={store}>
			<div>
				<HeaderComponent />
				<div id="body">
					<NoteViewerComponent />
					<NotepadExplorerComponent />
				</div>
			</div>
		</Provider>,
		document.getElementById('root') as HTMLElement
	))
	.then(() => localforage.getItem('hasRunBefore'))
	.then(async (hasRunBefore: boolean) => {
		if (!hasRunBefore) store.dispatch(actions.getHelp.started(undefined));
		await localforage.setItem('hasRunBefore', true);
	});

registerServiceWorker();

// Save open notepad on changes
state$
	.pipe(
		map((state: IStoreState) => state.notepads.notepad),
		filter(Boolean),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filter(Boolean),
		distinctUntilChanged(),
		debounceTime(1000)
	)
	.subscribe((notepad: INotepad) => store.dispatch(actions.saveNotepad.started(notepad)));

// Update notepad when currentNote changes
state$
	.pipe(
		map((state: IStoreState) => state.notepads.notepad),
		filter(Boolean),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filter(Boolean),
		distinctUntilChanged(),
		withLatestFrom(
			from(state$)
				.pipe(
					map((state: IStoreState) => state.currentNote.item),
					filter(Boolean),
					map((note: INote) => note.internalRef)
				)
		),
		filter(([notepad, ref]: [INotepad, string]) => !!notepad && !!ref),
		map(([notepad, ref]: [INotepad, string]) => {
			let noteInNotepad: INote | false = false;
			getNotepadObjectByRef(notepad, ref, obj => noteInNotepad = obj as INote);
			return noteInNotepad;
		}),
		filter(Boolean)
	)
	.subscribe((note: INote) => store.dispatch(actions.updateNoteInNotepad(note)));
