import { actions } from '../../core/actions';
import {
	catchError,
	concatMap,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	switchMap,
	tap
} from 'rxjs/operators';
import { Action, isType, Success } from 'redux-typescript-actions';
import { combineEpics } from 'redux-observable';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '..';
import { IStoreState } from '../../core/types';
import { ICurrentNoteState } from '../../core/reducers/NoteReducer';
import * as localforage from 'localforage';
import { from, Observable, of } from 'rxjs';
import { Dialog } from '../dialogs';
import { ISyncedNotepad } from '../../core/types/SyncTypes';
import { FlatNotepad, Note, Notepad } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { elvis, getUsedAssets, isAction, resolveElvis } from '../util';
import { Store } from 'redux';
import { fromShell } from '../CryptoService';
import { AddCryptoPasskeyAction, EncryptNotepadAction } from '../../core/types/ActionTypes';
import { NotepadShell } from 'upad-parse/dist/interfaces';

let currentNotepadTitle = '';

const saveNotepad$ = (action$: Observable<Action<Notepad>>, store: Store<IStoreState>) =>
	action$.pipe(
		filter((action: Action<Notepad>) => isType(action, actions.saveNotepad.started)),
		map((action: Action<Notepad>) => action.payload),
		switchMap((notepad: Notepad) => from((async () =>
			await NOTEPAD_STORAGE.setItem(
				notepad.title,
				await notepad.toJson(!!notepad.crypto ? store.getState().notepadPasskeys[notepad.title] : undefined)
			)
		)())),
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

const openNotepadFromStorage$ = (action$: Observable<Action<String>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.openNotepadFromStorage.started),
		map((action: Action<string>) => action.payload),
		switchMap((notepadTitle: string) =>
			from(NOTEPAD_STORAGE.getItem(notepadTitle)).pipe(
				switchMap((json: string) => {
					return from(fromShell(JSON.parse(json), store.getState().notepadPasskeys[notepadTitle]));
				}),
				mergeMap((res: EncryptNotepadAction) => [
					actions.addCryptoPasskey({ notepadTitle: res.notepad.title, passkey: res.passkey }),
					actions.openNotepadFromStorage.done({ params: '', result: undefined }),
					actions.parseNpx.done({ params: '', result: res.notepad.flatten() }),
				]),
				catchError(err => {
					console.error(err);
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

const persistLastOpenedNotepad$ = (action$: Observable<Action<Success<string, FlatNotepad>>>) =>
	action$.pipe(
		isAction(actions.parseNpx.done),
		map(action => action.payload.result),
		tap((notepad: FlatNotepad) =>
			localforage
				.setItem('last opened notepad', notepad.title)
				.catch(() => { return; })
		),
		filter(() => false)
	);

const clearLastOpenedNotepad$ = (action$: Observable<Action<Success<string, FlatNotepad>>>) =>
	action$.pipe(
		isAction(actions.closeNotepad, actions.parseNpx.failed, actions.deleteNotepad),
		tap(() =>
			localforage
				.setItem('last opened notepad', undefined)
				.catch(() => { return; })
		),
		filter(() => false)
	);

const clearOldData$ = (action$: Observable<Action<void>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.clearOldData.started),
		concatMap(() =>
			from(cleanHangingAssets(NOTEPAD_STORAGE, ASSET_STORAGE, store)).pipe(
				mergeMap((addPasskeyActions: Action<AddCryptoPasskeyAction>[]) => [
					actions.clearOldData.done({ params: undefined, result: undefined }),
					...addPasskeyActions
				]),
				catchError(error => {
					Dialog.alert('There was an error clearing old data');
					console.error(error);
					return of(actions.clearOldData.failed({ params: undefined, error }));
				})
			)
		)
	);

const notifyOnClearOldDataSuccess$ = (action$: Observable<Action<Success<void, void>>>) =>
	action$.pipe(
		isAction(actions.clearOldData.done),
		tap(() => Dialog.alert('The spring cleaning has been done!')),
		filter(() => false)
	);

export const storageEpics$ = combineEpics(
	saveNotepad$,
	getNotepadList$,
	openNotepadFromStorage$,
	deleteNotepad$,
	saveOnChanges$,
	saveDefaultFontSize$,
	cleanUnusedAssets$,
	persistLastOpenedNotepad$,
	clearLastOpenedNotepad$,
	clearOldData$,
	notifyOnClearOldDataSuccess$
);

/**
 *  Clean up all the assets that aren't in any notepads yet
 */
async function cleanHangingAssets(notepadStorage: LocalForage, assetStorage: LocalForage, store: Store<IStoreState>): Promise<Action<AddCryptoPasskeyAction>[]> {
	const cryptoPasskeys: Action<AddCryptoPasskeyAction>[] = [];

	const notepads: Promise<EncryptNotepadAction>[] = [];
	await notepadStorage.iterate((json: string) => {
		const shell: NotepadShell = JSON.parse(json);
		notepads.push(fromShell(shell, store.getState().notepadPasskeys[shell.title]));

		return;
	});

	const allUsedAssets: Set<string> = new Set<string>();
	const resolvedNotepadsOrErrors = (await Promise.all(
		notepads
			.map(p => p.catch(err => err))
	));

	const areNotepadsStillEncrypted = !!resolvedNotepadsOrErrors.find(res => res instanceof Error);

	const resolvedNotepads = resolvedNotepadsOrErrors.filter(res => !(res instanceof Error)).map((cryptoInfo: EncryptNotepadAction) => {
		cryptoPasskeys.push(actions.addCryptoPasskey({ notepadTitle: cryptoInfo.notepad.title, passkey: cryptoInfo.passkey }));
		return cryptoInfo.notepad;
	});

	// Handle deletion of unused assets, same as what's done in the epic
	for (let notepad of resolvedNotepads) {
		const assets = notepad.notepadAssets;
		const usedAssets = getUsedAssets(notepad.flatten());
		const unusedAssets = assets.filter(uuid => !usedAssets.has(uuid));
		usedAssets.forEach(uuid => allUsedAssets.add(uuid));

		await Promise.all(unusedAssets.map(uuid => assetStorage.removeItem(uuid)));

		// Update notepadAssets
		notepad = notepad.clone({ notepadAssets: Array.from(usedAssets) });

		await notepadStorage.setItem(
			notepad.title,
			await notepad.toJson(
				resolveElvis(
					elvis(cryptoPasskeys.find(action => action.payload.notepadTitle === notepad.title))
					.payload
					.passkey
				)
			)
		);
	}

	if (areNotepadsStillEncrypted) return cryptoPasskeys;

	// Handle the deletion of assets we've lost track of and aren't in any notepad
	let lostAssets: string[] = [];
	await assetStorage.iterate((value, key) => {
		lostAssets.push(key);
		return;
	});
	lostAssets = lostAssets.filter(uuid => !allUsedAssets.has(uuid));

	for (const uuid of lostAssets) {
		await assetStorage.removeItem(uuid);
	}

	return cryptoPasskeys;
}
