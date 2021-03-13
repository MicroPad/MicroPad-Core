import { combineEpics } from 'redux-observable';
import { catchError, concatMap, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { dataURItoBlob, generateGuid, isAction } from '../util';
import saveAs from 'save-as';
import { MoveNotepadObjectAction, NewNotepadObjectAction, UpdateElementAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist/index';
import { NoteElement } from 'upad-parse/dist/Note';
import { Store } from 'redux';
import * as Materialize from 'materialize-css/dist/js/materialize';
import { ASSET_STORAGE } from '../root';

const loadNote$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<string>) => isType(action, actions.loadNote.started)),
		tap(() => Materialize.Toast.removeAll()),
		map((action: Action<string>) => [action.payload, { ...(store.getState().notepads.notepad || {} as INotepadStoreState).item }]),
		filter(([ref, notepad]: [string, FlatNotepad]) => !!ref && !!notepad),
		map(([ref, notepad]: [string, FlatNotepad]) => notepad.notes[ref]),
		filter(Boolean),
		mergeMap((note: Note) => [actions.expandFromNote({
			note,
			notepad: (store.getState() as IStoreState).notepads.notepad!.item!
		}), actions.checkNoteAssets.started([note.internalRef, note.elements])])
	);

const checkNoteAssets$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<[string, NoteElement[]]>) => isType(action, actions.checkNoteAssets.started)),
		map((action: Action<[string, NoteElement[]]>) => action.payload),
		switchMap(([ref, elements]) =>
			from(getNoteAssets(elements))
				.pipe(map((res) => [ref, res.elements, res.blobUrls]))
		),
		map(([ref, elements, blobUrls]: [string, NoteElement[], object, FlatNotepad]) => [ref, elements, blobUrls, (store.getState().notepads.notepad || {} as INotepadStoreState).item]),
		filter(([ref, elements, blobUrls, notepad]: [string, NoteElement[], object, FlatNotepad]) => !!notepad),
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
				actions.checkNoteAssets.done({ params: [] as any, result: newNotepad }),
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
					map(blob => [blob as Blob, filename])
				)
		),
		filter(Boolean),
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

const reloadNote$ = (action$, store) =>
	action$.pipe(
		isAction(actions.reloadNote),
		map(() => store.getState()),
		map((state: IStoreState) => state.currentNote.ref),
		filter((noteRef: string) => !!noteRef && noteRef.length > 0),
		map((noteRef: string) => actions.loadNote.started(noteRef))

	);

const autoLoadNewNote$ = (action$, store) =>
	action$.pipe(
		isAction(actions.newNote),
		map((action: Action<NewNotepadObjectAction>) => [action.payload, (store.getState() as IStoreState).notepads.notepad!.item]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!insertAction.parent && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) =>
			// Get a note with the new title that is in the expected parent
			Object.values((notepad as FlatNotepad).notes).find(n => n.parent === insertAction.parent && n.title === insertAction.title)
		),
		filter(Boolean),
		map((newNote: Note) => actions.loadNote.started(newNote.internalRef))
	);

const closeNoteOnDeletedParent$ = (action$, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.deleteNotepadObject),
		map(() => store.getState().notepads.notepad),
		filter(Boolean),
		map((notepadState: INotepadStoreState) => notepadState.item),

		// Has the currently opened note been deleted?
		filter((notepad: FlatNotepad) => store.getState().currentNote.ref.length > 0 && !notepad.notes[store.getState().currentNote.ref]),
		map(() => actions.closeNote(undefined))
	);

const loadNoteOnMove$ = action$ =>
	action$.pipe(
		isAction(actions.moveNotepadObject),
		map((action: Action<MoveNotepadObjectAction>) => action.payload),
		filter((payload: MoveNotepadObjectAction) => payload.type === 'note'),
		map((payload: MoveNotepadObjectAction) => actions.loadNote.started(payload.objectRef))
	);

const quickMarkdownInsert$ = (action$: Observable<Action<void>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.quickMarkdownInsert),
		map(() => store.getState().currentNote.ref),
		filter(ref => ref.length > 0 && !!store.getState().notepads.notepad && !!store.getState().notepads.notepad!.item),
		map(ref => store.getState().notepads.notepad!.item!.notes[ref]),
		concatMap(note => {
			let count = note.elements.filter(e => e.type === 'markdown').length + 1;
			let id = `markdown${count}`;
			// eslint-disable-next-line no-loop-func
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
							fontSize: store.getState().app.defaultFontSize
						},
						content: ''
					}
				}),

				actions.openEditor(id)
			];
		})
	);

const imagePasted$ = (action$: Observable<Action<string>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.imagePasted.started),
		filter(() => store.getState().currentNote.ref.length > 0),
		map(action => action.payload),
		switchMap(imageUrl =>
			from(fetch(imageUrl).then(res => res.blob())).pipe(
				concatMap(image => {
					const note = store.getState().notepads.notepad!.item!.notes[store.getState().currentNote.ref];
					let count = note.elements.filter(e => e.type === 'image').length + 1;
					let id = `image${count}`;
					// eslint-disable-next-line no-loop-func
					while (note.elements.some(e => e.args.id === id)) id = `image${++count}`;

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
							noteRef: store.getState().currentNote.ref,
							element
						}),

						actions.updateElement({
							element,
							noteRef: store.getState().currentNote.ref,
							elementId: id,
							newAsset: image
						})
					];
				}),
				catchError(error => of(actions.imagePasted.failed({ params: '', error })))
			)
		)
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

	elements = elements.map(element => {
		// Is this a notebook before v2?
		if (element.type !== 'markdown' && element.content !== 'AS') {
			const asset = new Asset(dataURItoBlob(element.content));
			storageRequests.push(ASSET_STORAGE.setItem(asset.uuid, asset.data));
			blobRefs.push(asset.uuid);

			return { ...element, args: { ...element.args, ext: asset.uuid }, content: 'AS' };
		}

		// Notebooks from v2 or higher
		if (!!element.args.ext) {
			storageRequests.push(
				ASSET_STORAGE.getItem(element.args.ext)
					.then((blobObj) => {
						const blob = blobObj as Blob;

						if (element.type === 'pdf') {
							return blob.slice(0, blob.size, 'application/pdf');
						}

						return blob;
					})
			);

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
