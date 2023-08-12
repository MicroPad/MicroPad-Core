import { actions, MicroPadAction, MicroPadActions } from '../actions';
import {
	catchError,
	concatMap,
	debounceTime,
	distinctUntilChanged,
	distinctUntilKeyChanged,
	filter,
	map,
	mergeMap,
	switchMap,
	take,
	tap,
	withLatestFrom
} from 'rxjs/operators';
import { Action } from 'typescript-fsa';
import { combineEpics, Epic, ofType } from 'redux-observable';
import { INotepadStoreState } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import * as localforage from 'localforage';
import { from, interval, Observable, of } from 'rxjs';
import { Dialog } from '../services/dialogs';
import { ISyncedNotepad } from '../types/SyncTypes';
import { FlatNotepad, Note, Notepad } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { filterTruthy, getUsedAssets, noEmit } from '../util';
import { DecryptionError, fromShell } from '../services/CryptoService';
import { AddCryptoPasskeyAction, EncryptNotepadAction } from '../types/ActionTypes';
import { NotepadShell } from 'upad-parse/dist/interfaces';
import { ASSET_STORAGE, NOTEPAD_STORAGE } from '../root';
import { ICurrentNoteState } from '../reducers/NoteReducer';
import { EpicDeps, EpicStore } from './index';
import { isReadOnlyNotebook } from '../ReadOnly';

const NOTEPAD_LIST_POLL_INTERVAL = 60 * 1000; // 1 minute

let currentNotepadTitle = '';

const saveNotepad$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.saveNotepad.started.type),
		map(action => (action as MicroPadActions['saveNotepad']['started']).payload),
		concatMap((notepad: Notepad) =>
			from((async () =>
					await NOTEPAD_STORAGE.setItem(
						notepad.title,
						await notepad.toJson(!!notepad.crypto ? state$.value.notepadPasskeys[notepad.title] : undefined)
					)
			)()).pipe(
				catchError(err => of(actions.saveNotepad.failed({ params: {} as Notepad, error: err }))),
				map(() => actions.saveNotepad.done({ params: {} as Notepad, result: undefined }))
			)
		)
	);

const saveOnChanges$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	state$.pipe(
		map((state: IStoreState) => state.notepads.notepad?.item),
		filterTruthy(),
		debounceTime(1000),
		distinctUntilKeyChanged('lastModified'),
		filter((notepad: FlatNotepad) => {
			const condition = notepad.title === currentNotepadTitle;
			currentNotepadTitle = notepad.title;

			return condition;
		}),
		filter(notepad => !isReadOnlyNotebook(notepad.title)),
		map((notepad: FlatNotepad) => notepad.toNotepad()),
		mergeMap((notepad: Notepad) => {
			const actionsToReturn: MicroPadAction[] = [];

			const syncId = state$.value.notepads.notepad?.activeSyncId;
			if (syncId) {
				actionsToReturn.push(actions.actWithSyncNotepad({
					notepad,
					action: (np: ISyncedNotepad) => actions.sync({ notepad: np, syncId })
				}));
			}

			return [
				...actionsToReturn,
				actions.saveNotepad.started(notepad)
			];
		})
	);

const saveDefaultFontSize$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		withLatestFrom(state$),
		map(([,state]): [INotepadStoreState, ICurrentNoteState] => [state.notepads.notepad!, state.currentNote]),
		filter(([notepad, current]: [INotepadStoreState, ICurrentNoteState]) => !!notepad?.item && !!current && current.ref.length > 0),
		map(([notepad, current]: [INotepadStoreState, ICurrentNoteState]): [Note, string] => [notepad.item!.notes[current.ref], current.elementEditing]),
		filter(([note, id]: [Note, string]) => !!note && id.length > 0),
		map(([note, id]: [Note, string]) => note.elements.filter((element: NoteElement) => element.args.id === id)[0]?.args?.fontSize),
		filter((fontSize): fontSize is string => !!fontSize),
		distinctUntilChanged(),
		tap((fontSize: string) => localforage.setItem('font size', fontSize)),
		map((fontSize: string) => actions.updateDefaultFontSize(fontSize))
	);

const getNotepadList$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.getNotepadList.started.type),
		switchMap(() =>
			from(NOTEPAD_STORAGE.keys()).pipe(
				map((keys: string[]) => {
					return actions.getNotepadList.done({ params: undefined, result: keys });
				}),
				catchError(err => of(actions.getNotepadList.failed({ params: undefined, error: err })))
			)
		)
	);

const pollNotepadList$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.getNotepadList.done.type),
		take(1),
		switchMap(() => interval(NOTEPAD_LIST_POLL_INTERVAL).pipe(
			map(() => actions.getNotepadList.started())
		))
	);

const openNotepadFromStorage$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.openNotepadFromStorage.started.type),
		map(action => (action as MicroPadActions['openNotepadFromStorage']['started']).payload),
		switchMap((notepadTitle: string) =>
			from(NOTEPAD_STORAGE.getItem<string>(notepadTitle)).pipe(
				switchMap((json: string | null) => {
					return from(fromShell(JSON.parse(json!), state$.value.notepadPasskeys[notepadTitle]));
				}),
				mergeMap((res: EncryptNotepadAction) => [
					actions.addCryptoPasskey({ notepadTitle: res.notepad.title, passkey: res.passkey, remember: res.rememberKey }),
					actions.openNotepadFromStorage.done({ params: notepadTitle, result: undefined }),
					actions.parseNpx.done({ params: '', result: res.notepad.flatten() }),
				]),
				catchError(err => {
					console.error(err);

					if (err instanceof DecryptionError) {
						Dialog.alert(err.message);
						return of(
							actions.openNotepadFromStorage.failed({ params: notepadTitle, error: err })
						);
					} else {
						Dialog.alert(`There was an error opening your notebook`);
					}

					return of(actions.openNotepadFromStorage.failed({ params: notepadTitle, error: err }));
				})
			)
		)
	);

const cleanUnusedAssets$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$
		.pipe(
			ofType(actions.parseNpx.done.type, actions.deleteElement.type, actions.deleteNotepadObject.type),
			map(() => state$.value),
			map((state: IStoreState) => state.notepads.notepad),
			filterTruthy(),
			map((notepadState: INotepadStoreState) => notepadState.item),
			filterTruthy(),
			map((notepad: FlatNotepad): [Set<string>, string[]] => [getUsedAssets(notepad), notepad.notepadAssets]),
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

const deleteNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.deleteNotepad.type),
		map(action => (action as MicroPadActions['deleteNotepad']).payload),
		tap((notepadTitle: string) => from(NOTEPAD_STORAGE.removeItem(notepadTitle))),
		map(() => actions.clearOldData.started({ silent: true }))
	);

export type LastOpenedNotepad = { notepadTitle: string, noteRef?: string };
const persistLastOpenedNotepad$ = (action$: Observable<MicroPadAction>, _store, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.parseNpx.done.type),
		map(action => (action as MicroPadActions['parseNpx']['done']).payload.result),
		tap((notepad: FlatNotepad) =>
			getStorage()
				.generalStorage
				.setItem<LastOpenedNotepad>('last opened notepad', { notepadTitle: notepad.title, noteRef: undefined })
				.catch(() => { return; })
		),
		noEmit()
	);

const persistLastOpenedNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.loadNote.done.type),
		filter(() => !!state$.value.notepads.notepad?.item),
		map((action): LastOpenedNotepad => ({
			notepadTitle: state$.value.notepads.notepad?.item?.title!,
			noteRef: (action as MicroPadActions['loadNote']['done']).payload.params
		})),
		tap(lastOpened =>
			getStorage()
				.generalStorage
				.setItem<LastOpenedNotepad>('last opened notepad', lastOpened)
				.catch(() => { return; })
		),
		noEmit()
	);

const clearLastOpenNoteOnClose$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.closeNote.type, actions.deleteNotepadObject.type),
		map(() => state$.value.notepads.notepad?.item?.title),
		tap(currentNotepad => {
			if (currentNotepad) {
				getStorage()
					.generalStorage
					.setItem<LastOpenedNotepad>('last opened notepad', { notepadTitle: currentNotepad })
					.catch(() => { return; })
			} else {
				getStorage()
					.generalStorage
					.removeItem('last opened notepad')
					.catch(() => { return; })
			}
		}),
		noEmit()
	);

const clearLastOpenedNotepad$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(
			actions.closeNotepad.type,
			actions.parseNpx.failed.type,
			actions.deleteNotepad.type,
			actions.renameNotepad.done.type
		),
		tap(() =>
			localforage
				.setItem('last opened notepad', undefined)
				.catch(() => { return; })
		),
		noEmit()
	);

const clearOldData$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.clearOldData.started.type),
		map(action => action as MicroPadActions['clearOldData']['started']),
		tap(action => {
			// Clear saved crypto passwords if the user clicked the manual button
			if (!action.payload.silent) {
				getStorage().cryptoPasskeysStorage.clear().catch(err => console.error(err));
			}
		}),
		concatMap(action =>
			from(cleanHangingAssets(NOTEPAD_STORAGE, ASSET_STORAGE, state$.value, action.payload.silent)).pipe(
				mergeMap((addPasskeyActions: Action<AddCryptoPasskeyAction>[]) => [
					actions.clearOldData.done({ params: action.payload, result: undefined }),
					...addPasskeyActions
				]),
				catchError(error => {
					Dialog.alert('There was an error clearing old data');
					console.error(error);
					return of(actions.clearOldData.failed({ params: action.payload, error }));
				})
			)
		)
	);

const notifyOnClearOldDataSuccess$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.clearOldData.done.type),
		tap(action =>
			!(action as MicroPadActions['clearOldData']['done']).payload.params.silent && Dialog.alert('The spring cleaning has been done!')
		),
		noEmit()
	);

export const storageEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	saveNotepad$,
	getNotepadList$,
	pollNotepadList$,
 	openNotepadFromStorage$,
	deleteNotepad$,
	saveOnChanges$,
	saveDefaultFontSize$ as Epic<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>,
	cleanUnusedAssets$ as Epic<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>,
	persistLastOpenedNotepad$,
	persistLastOpenedNote$,
	clearLastOpenNoteOnClose$,
	clearLastOpenedNotepad$,
	clearOldData$,
	notifyOnClearOldDataSuccess$
);

/**
 *  Clean up all the assets that aren't in any notepads yet
 */
async function cleanHangingAssets(notepadStorage: LocalForage, assetStorage: LocalForage, state: IStoreState, silent): Promise<Action<AddCryptoPasskeyAction>[]> {
	const cryptoPasskeys: Action<AddCryptoPasskeyAction>[] = [];

	const notepads: Promise<EncryptNotepadAction | Error>[] = [];
	await notepadStorage.iterate((json: string) => {
		const shell: NotepadShell = JSON.parse(json);
		let passkey = state.notepadPasskeys[shell.title];
		if (!passkey && silent) {
			passkey = '';
		}

		notepads.push(fromShell(shell, passkey).catch(err => err));

		return;
	});

	const allUsedAssets: Set<string> = new Set<string>();
	const resolvedNotepadsOrErrors = (await Promise.all(
		notepads
			.map(p => p.catch(err => err))
	));

	const areNotepadsStillEncrypted = !!resolvedNotepadsOrErrors.find(res => res instanceof Error);

	const resolvedNotepads = resolvedNotepadsOrErrors.filter((res): res is EncryptNotepadAction => !(res instanceof Error)).map((cryptoInfo: EncryptNotepadAction) => {
		cryptoPasskeys.push(actions.addCryptoPasskey({ notepadTitle: cryptoInfo.notepad.title, passkey: cryptoInfo.passkey, remember: false }));
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
				cryptoPasskeys.find(action => action.payload.notepadTitle === notepad.title)?.payload?.passkey
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
