import { combineEpics } from 'redux-observable';
import { catchError, concatMap, filter, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../../core/actions';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { dataURItoBlob, filterTruthy, generateGuid, isAction } from '../util';
import saveAs from 'save-as';
import { ASSET_STORAGE } from '..';
import { MoveNotepadObjectAction, NewNotepadObjectAction, UpdateElementAction } from '../../core/types/ActionTypes';
import { IStoreState } from '../../core/types';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist/index';
import { NoteElement } from 'upad-parse/dist/Note';
import * as Materialize from 'materialize-css/dist/js/materialize';

const loadNote$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.loadNote.started)),
		tap(() => Materialize.Toast.removeAll()),
		switchMap((action: Action<string>) => state$.pipe(
			take(1),
			map(state => [action.payload, { ...(state.notepads.notepad || <INotepadStoreState> {}).item }]),
			filter(([ref, notepad]: [string, FlatNotepad]) => !!ref && !!notepad),
			map(([ref, notepad]: [string, FlatNotepad]) => notepad.notes[ref]),
			filterTruthy(),
			withLatestFrom(state$),
			mergeMap(([note, state]: [Note, IStoreState]) => [actions.expandFromNote({
				note,
				notepad: state.notepads.notepad!.item!
			}), actions.checkNoteAssets.started([note.internalRef, note.elements])])
		))
	);

const checkNoteAssets$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		filter((action: Action<[string, NoteElement[]]>) => isType(action, actions.checkNoteAssets.started)),
		map((action: Action<[string, NoteElement[]]>) => action.payload),
		switchMap(([ref, elements]) =>
			from(getNoteAssets(elements))
				.pipe(map((res) => [ref, res.elements, res.blobUrls]))
		),
		switchMap(([ref, elements, blobUrls]) => state$.pipe(
			take(1),
			map(state => [ref, elements, blobUrls, (state.notepads.notepad || <INotepadStoreState> {}).item])
		)),
		filter(([ref, elements, blobUrls, notepad]) => !!notepad),
		mergeMap(([ref, elements, blobUrls, notepad]: [string, NoteElement[], object, FlatNotepad]) => {
			let newNotepad = notepad.clone({
				notes: {
					...notepad.notes,
					[ref]: notepad.notes[ref].clone({ elements })
				}
			});

			const notepadAssets: Set<string> = new Set(notepad.notepadAssets);
			elements.forEach(element => {
				if (element.content === 'AS') {
					notepadAssets.add(element.args.ext!);
				}
			});
			newNotepad.clone({ notepadAssets: Array.from(notepadAssets) });

			return [
				actions.checkNoteAssets.done({ params: <any> [], result: newNotepad }),
				actions.loadNote.done({ params: ref, result: blobUrls })
			];
		})
	);

const downloadAsset$ = action$ =>
	action$.pipe(
		filter((action: Action<{ filename: string, uuid: string }>) => isType(action, actions.downloadAsset.started)),
		map((action: Action<{ filename: string, uuid: string }>) => action.payload),
		switchMap(({filename, uuid}: { filename: string, uuid: string }) =>
			from(ASSET_STORAGE.getItem(uuid))
				.pipe(
					map((blob: Blob) => [blob, filename])
				)
		),
		filterTruthy(),
		tap(([blob, filename]: [Blob, string]) => saveAs(blob, filename)),
		map(([blob, filename]: [Blob, string]) => actions.downloadAsset.done({ params: { filename, uuid: '' }, result: undefined }))
	);

const binaryElementUpdate$ = action$ =>
	action$.pipe(
		isAction(actions.updateElement),
		map((action: Action<UpdateElementAction>) => action.payload),
		filter((params: UpdateElementAction) => !!params.newAsset),
		switchMap((params: UpdateElementAction) => {
			const key = params.element.args.ext || generateGuid();
			return from(
				ASSET_STORAGE.setItem(key, params.newAsset)
					.then(() => {
						return [params, key];
					})
			);
		}),
		mergeMap(([params, guid]: [UpdateElementAction, string]) => [
			actions.trackAsset(guid),
			actions.updateElement({
				elementId: params.elementId,
				noteRef: params.noteRef,
				element: {
					...params.element,
					content: 'AS',
					args: {
						...params.element.args,
						ext: guid
					}
				}
			}),
			actions.reloadNote(undefined)
		])
	);

const reloadNote$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.reloadNote),
		switchMap(() => state$.pipe(take(1))),
		map((state: IStoreState) => state.currentNote.ref),
		filter((noteRef: string) => !!noteRef && noteRef.length > 0),
		map((noteRef: string) => actions.loadNote.started(noteRef))

	);

const autoLoadNewNote$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.newNote),
		switchMap((action: Action<NewNotepadObjectAction>) => state$.pipe(
			take(1),
			map(state => [action.payload, state.notepads.notepad!.item]),
		)),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!insertAction.parent && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) =>
			// Get a note with the new title that is in the expected parent
			Object.values((notepad as FlatNotepad).notes).find(n => n.parent === insertAction.parent && n.title === insertAction.title)
		),
		filterTruthy(),
		map((newNote: Note) => actions.loadNote.started(newNote.internalRef))
	);

const closeNoteOnDeletedParent$ = (action$, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.deleteNotepadObject),
		switchMap(() => state$.pipe(
			take(1),
			map(state => state.notepads.notepad)
		)),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),

		// Has the currently opened note been deleted?
		withLatestFrom(state$),
		filter(([notepad, state]: [FlatNotepad, IStoreState]) => state.currentNote.ref.length > 0 && !notepad.notes[state.currentNote.ref]),
		map(() => actions.closeNote(undefined))
	);

const loadNoteOnMove$ = action$ =>
	action$.pipe(
		isAction(actions.moveNotepadObject),
		map((action: Action<MoveNotepadObjectAction>) => action.payload),
		filter((payload: MoveNotepadObjectAction) => payload.type === 'note'),
		map((payload: MoveNotepadObjectAction) => actions.loadNote.started(payload.objectRef))
	);

const quickMarkdownInsert$ = (action$: Observable<Action<void>>, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.quickMarkdownInsert),
		switchMap(() => state$.pipe(take(1))),
		map(state => [state, state.currentNote.ref]),
		filter(([state, ref]: [IStoreState, string]) => ref.length > 0 && !!state.notepads.notepad && !!state.notepads.notepad!.item),
		map(([state, ref]: [IStoreState, string]) => [state.notepads.notepad!.item!.notes[ref], state.app.defaultFontSize]),
		concatMap(([note, defaultFontSize]: [Note, string]) => {
			let count = note.elements.filter(e => e.type === 'markdown').length + 1;
			let id = `markdown${count}`;
			while (note.elements.some(e => e.args.id === id)) id = `markdown${++count}`;

			return [
				actions.insertElement({
					noteRef: note.internalRef,
					element: {
						type: 'markdown',
						args: {
							id,
							x: '10px',
							y: '10px',
							width: 'auto',
							height: 'auto',
							fontSize: defaultFontSize
						},
						content: ''
					}
				}),

				actions.openEditor(id)
			];
		})
	);

const imagePasted$ = (action$: Observable<Action<string>>, state$: Observable<IStoreState>) =>
	action$.pipe(
		isAction(actions.imagePasted.started),
		map(action => action.payload),
		switchMap(imageUrl => state$.pipe(
			take(1),
			filter(state => state.currentNote.ref.length > 0),
			switchMap(state =>
				from(fetch(imageUrl).then(res => res.blob())).pipe(
					concatMap(image => {
						const note = state.notepads.notepad!.item!.notes[state.currentNote.ref];
						const id = `image${note.elements.filter(e => e.type === 'image').length + 1}`;
						const element: NoteElement = {
							type: 'image',
							args: {
								id,
								x: '10px',
								y: '10px',
								width: 'auto',
								height: 'auto',
							},
							content: 'AS'
						};

						return [
							actions.insertElement({
								noteRef: state.currentNote.ref,
								element
							}),

							actions.updateElement({
								element,
								noteRef: state.currentNote.ref,
								elementId: id,
								newAsset: image
							})
						];
					}),
					catchError(error => of(actions.imagePasted.failed({ params: '', error })))
				)
			)
		))
	);

export const noteEpics$ = combineEpics(
	loadNote$,
	checkNoteAssets$,
	downloadAsset$,
	binaryElementUpdate$,
	reloadNote$,
	autoLoadNewNote$,
	closeNoteOnDeletedParent$,
	loadNoteOnMove$,
	quickMarkdownInsert$,
	imagePasted$
);

function getNoteAssets(elements: NoteElement[]): Promise<{ elements: NoteElement[], blobUrls: object }> {
	const storageRequests: Promise<Blob>[] = [];
	const blobRefs: string[] = [];

	elements.map(element => {
		if (element.type !== 'markdown' && element.content !== 'AS') {
			const asset = new Asset(dataURItoBlob(element.content));
			storageRequests.push(ASSET_STORAGE.setItem(asset.uuid, asset.data));
			blobRefs.push(asset.uuid);

			return { ...element, args: { ...element.args, ext: asset.uuid }, content: 'AS' };
		}

		if (!!element.args.ext) {
			storageRequests.push(ASSET_STORAGE.getItem(element.args.ext));
			blobRefs.push(element.args.ext);
		}

		return element;
	});

	return new Promise(resolve =>
		Promise.all(storageRequests)
			.then((blobs: Blob[]) => {
				const blobUrls = {};
				blobs.filter(b => !!b).forEach((blob, i) => blobUrls[blobRefs[i]] = URL.createObjectURL(blob));

				resolve({
					elements,
					blobUrls
				});
			})
	);
}
