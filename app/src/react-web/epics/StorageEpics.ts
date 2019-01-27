import { actions } from '../../core/actions';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '..';
import { IStoreState } from '../../core/types';
import { ICurrentNoteState } from '../../core/reducers/NoteReducer';
import * as localforage from 'localforage';
import { from, of } from 'rxjs';
import { Dialog } from '../dialogs';
import { ISyncedNotepad } from '../../core/types/SyncTypes';
import { FlatNotepad, Note, Notepad } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { getUsedAssets } from '../util';

let currentNotepadTitle = '';

const saveNotepad$ = action$ =>
	action$.pipe(
		filter((action: Action<Notepad>) => isType(action, actions.saveNotepad.started)),
		map((action: Action<Notepad>) => action.payload),
		switchMap((notepad: Notepad) => from(NOTEPAD_STORAGE.setItem(notepad.title, notepad.toJson()))),
		catchError(err => of(actions.saveNotepad.failed({ params: <Notepad> {}, error: err }))),
		map(() => actions.saveNotepad.done({ params: <Notepad> {}, result: undefined }))
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
		filter((notepad: FlatNotepad) => {
			const condition = notepad.title === currentNotepadTitle;
			currentNotepadTitle = notepad.title;

			return condition;
		}),
		map((notepad: FlatNotepad) => notepad.toNotepad()),
		mergeMap((notepad: Notepad) => {
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
		map(([notepad, current]: [INotepadStoreState, ICurrentNoteState]) => [notepad.item!.notes[current.ref], current.elementEditing]),
		filter(([note, id]: [Note, string]) => !!note && id.length > 0),
		map(([note, id]: [Note, string]) => note.elements.filter((element: NoteElement) => element.args.id === id)[0]),
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
		switchMap(() =>
			from(NOTEPAD_STORAGE.keys()).pipe(
				map((keys: string[]) => {
					return actions.getNotepadList.done({ params: undefined, result: keys });
				}),
				catchError(err => of(actions.getNotepadList.failed({ params: undefined, error: err })))
			)
		)
	);

const openNotepadFromStorage$ = action$ =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.openNotepadFromStorage.started)),
		map((action: Action<string>) => action.payload),
		switchMap((notepadTitle: string) =>
			from(NOTEPAD_STORAGE.getItem(notepadTitle)).pipe(
				mergeMap((json: string) => [
					actions.openNotepadFromStorage.done({ params: '', result: undefined }),
					actions.restoreJsonNotepad(json)
				]),
				catchError(err => {
					Dialog.alert(`Error opening notepad`);
					return of(actions.openNotepadFromStorage.failed(err));
				})
			)
		)
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
			map((notepad: FlatNotepad) => [getUsedAssets(notepad), notepad.notepadAssets]),
			filter(([usedAssets, npAssets]: [Set<string>, string[]]) => !!usedAssets && !!npAssets),
			switchMap(([usedAssets, npAssets]: [Set<string>, string[]]) => {
				const unusedAssets = npAssets.filter(guid => !usedAssets.has(guid));
				return from(Promise.all(unusedAssets.map(guid => ASSET_STORAGE.removeItem(guid))).then(() => unusedAssets));
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
		tap((notepadTitle: string) => from(NOTEPAD_STORAGE.removeItem(notepadTitle))),
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
