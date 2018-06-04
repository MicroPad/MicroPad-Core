import { actions } from '../actions';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { INote, INotepad, INotepadStoreState, NoteElement } from '../types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '../index';
import { IStoreState } from '../types';
import * as stringify from 'json-stringify-safe';
import { ICurrentNoteState } from '../reducers/NoteReducer';
import { getNotepadObjectByRef } from '../util';
import * as localforage from 'localforage';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { Dialog } from '../dialogs';
import { ISyncedNotepad } from '../types/SyncTypes';

let currentNotepadTitle = '';

const saveNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<INotepad>) => isType(action, actions.saveNotepad.started)),
		map((action: Action<INotepad>) => action.payload),
		switchMap((notepad: INotepad) => Observable.fromPromise(NOTEPAD_STORAGE.setItem(notepad.title, stringify(notepad)))),
		catchError(err => Observable.of(actions.saveNotepad.failed({ params: <INotepad> {}, error: err }))),
		map(() => actions.saveNotepad.done({ params: <INotepad> {}, result: undefined }))
	);

const saveOnChanges$ = (action$, store) =>
	action$.pipe(
		map(() => store.getState()),
		map((state: IStoreState) => state.notepads.notepad),
		filter(Boolean),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filter(Boolean),
		debounceTime(1000),
		distinctUntilChanged(),
		filter((notepad: INotepad) => {
			const condition = notepad.title === currentNotepadTitle;
			currentNotepadTitle = notepad.title;

			return condition;
		}),
		mergeMap((notepad: INotepad) => {
			const actionsToReturn: Action<any>[] = [];

			const syncId = (<IStoreState> store.getState()).notepads.notepad!.activeSyncId;
			if (syncId) actionsToReturn.push(actions.actWithSyncNotepad({
				notepad,
				action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId })
			}));

			return [
				...actionsToReturn,
				actions.saveNotepad.started(notepad)
			];
		})
	);

const saveDefaultFontSize$ = (action$, store) =>
	action$.pipe(
		map(() => store.getState()),
		map((state: IStoreState) => [state.notepads.notepad, state.currentNote]),
		filter(([notepad, current]: [INotepadStoreState, ICurrentNoteState]) => !!notepad && !!notepad.item && !!current && current.ref.length > 0),
		map(([notepad, current]: [INotepadStoreState, ICurrentNoteState]) => {
			let note: INote | false = false;
			getNotepadObjectByRef(notepad.item!, current.ref, obj => note = <INote> obj);

			return [note, current.elementEditing];
		}),
		filter(([note, id]: [INote, string]) => !!note && id.length > 0),
		map(([note, id]: [INote, string]) => note.elements.filter((element: NoteElement) => element.args.id === id)[0]),
		filter(Boolean),
		map((element: NoteElement) => element.args.fontSize),
		filter(Boolean),
		distinctUntilChanged(),
		tap((fontSize: string) => localforage.setItem('font size', fontSize)),
		map((fontSize: string) => actions.updateDefaultFontSize(fontSize))
	);

const getNotepadList$ = action$ =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.getNotepadList.started)),
		switchMap(() => Observable.fromPromise(NOTEPAD_STORAGE.keys())),
		catchError(err => Observable.of(actions.getNotepadList.failed({ params: undefined, error: err }))),
		map((keys: string[]) => {
			return actions.getNotepadList.done({ params: undefined, result: keys });
		})
	);

const openNotepadFromStorage$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.openNotepadFromStorage.started)),
		map((action: Action<string>) => action.payload),
		switchMap((notepadTitle: string) => Observable.fromPromise(NOTEPAD_STORAGE.getItem(notepadTitle))),
		catchError(err => {
			Dialog.alert(`Error opening notepad`);
			return Observable.of(actions.openNotepadFromStorage.failed(err));
		}),
		mergeMap((json: string) => [
			actions.openNotepadFromStorage.done({ params: '', result: undefined }),
			actions.restoreJsonNotepad(json)
		])
	);

const cleanUnusedAssets$ = (action$, store) =>
	action$
		.pipe(
			filter((action: Action<any>) => isType(action, actions.parseNpx.done) || isType(action, actions.deleteElement)),
			map(() => store.getState()),
			map((state: IStoreState) => state.notepads.notepad),
			filter(Boolean),
			map((notepadState: INotepadStoreState) => notepadState.item),
			filter(Boolean),
			map((notepad: INotepad) => [notepad.getUsedAssets(), notepad.notepadAssets]),
			filter(([usedAssets, npAssets]: [Set<string>, string[]]) => !!usedAssets && !!npAssets),
			switchMap(([usedAssets, npAssets]: [Set<string>, string[]]) => {
				const unusedAssets = npAssets.filter(guid => !usedAssets.has(guid));
				return fromPromise(Promise.all(unusedAssets.map(guid => ASSET_STORAGE.removeItem(guid))).then(() => unusedAssets));
			}),
			mergeMap((unusedAssets: string[]) => [
				...unusedAssets.map(guid => actions.untrackAsset(guid))
			]),
			filter((res: Action<any>[]) => res.length > 0)
		);

const deleteNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.deleteNotepad)),
		map((action: Action<string>) => action.payload),
		tap((notepadTitle: string) => Observable.fromPromise(NOTEPAD_STORAGE.removeItem(notepadTitle))),
		filter(() => false)
	);

export const storageEpics$ = combineEpics(
	saveNotepad$,
	getNotepadList$,
	openNotepadFromStorage$,
	deleteNotepad$,
	saveOnChanges$,
	saveDefaultFontSize$,
	cleanUnusedAssets$
);
