import { combineEpics, ofType } from 'redux-observable';
import { catchError, concatMap, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { Action } from 'redux-typescript-actions';
import { actions, MicroPadAction } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { dataURItoBlob, filterTruthy, generateGuid } from '../util';
import saveAs from 'save-as';
import { MoveNotepadObjectAction, NewNotepadObjectAction, UpdateElementAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist/index';
import { NoteElement } from 'upad-parse/dist/Note';
import { ASSET_STORAGE } from '../root';
import { EpicDeps, EpicStore } from './index';

const loadNote$ = (action$: Observable<MicroPadAction>, store: EpicStore, { notificationService }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.loadNote.started.type),
		tap(() => notificationService.dismissToasts()),
		map((action: Action<string>): [string, FlatNotepad] => [action.payload, store.getState().notepads.notepad?.item!]),
		filter(([ref, notepad]: [string, FlatNotepad]) => !!ref && !!notepad),
		map(([ref, notepad]: [string, FlatNotepad]) => ({ ref: ref, note: notepad.notes[ref] })),
		mergeMap(({ ref, note }: { ref: string, note: Note | undefined }) => {
			if (note) {
				return [
					actions.expandFromNote({
						note,
						notepad: store.getState().notepads.notepad!.item!
					}), actions.checkNoteAssets.started([note.internalRef, note.elements])
				];
			}

			const error = new Error(`MicroPad couldn't load the current note (handled in loadNote$)`);
			console.error(error);
			return [actions.loadNote.failed({ params: ref, error })];
		})
	);

const checkNoteAssets$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<[string, NoteElement[]]>>(actions.checkNoteAssets.started.type),
		map((action): [string, NoteElement[]] => action.payload),
		switchMap(([ref, elements]) =>
			from(getNoteAssets(elements))
				.pipe(map((res): [string, NoteElement[], object] => [ref, res.elements, res.blobUrls]))
		),
		map(([ref, elements, blobUrls]: [string, NoteElement[], object]): [string, NoteElement[], object, FlatNotepad] => [ref, elements, blobUrls, store.getState().notepads.notepad?.item!]),
		filter(([_ref, _elements, _blobUrls, notepad]: [string, NoteElement[], object, FlatNotepad]) => !!notepad),
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

const downloadAsset$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<{ filename: string, uuid: string }>>(actions.downloadAsset.started.type),
		map((action: Action<{ filename: string, uuid: string }>) => action.payload),
		switchMap(({ filename, uuid }: { filename: string, uuid: string }) =>
			from(ASSET_STORAGE.getItem(uuid))
				.pipe(
					map((blob): [Blob, string] => [blob as Blob, filename])
				)
		),
		filterTruthy(),
		tap(([blob, filename]: [Blob, string]) => saveAs(blob, filename)),
		map(([_blob, filename]: [Blob, string]) => actions.downloadAsset.done({ params: { filename, uuid: '' }, result: undefined }))
	);

const binaryElementUpdate$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<UpdateElementAction>>(actions.updateElement.type),
		map((action: Action<UpdateElementAction>) => action.payload),
		filter((params: UpdateElementAction) => !!params.newAsset),
		switchMap((params: UpdateElementAction) => {
			const key = params.element.args.ext || generateGuid();
			return from(ASSET_STORAGE.setItem(key, params.newAsset).then((): [UpdateElementAction, string] => [params, key]));
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

const reloadNote$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.reloadNote.type),
		map(() => store.getState()),
		map((state: IStoreState) => state.currentNote.ref),
		filter((noteRef: string) => !!noteRef && noteRef.length > 0),
		map((noteRef: string) => actions.loadNote.started(noteRef))

	);

const autoLoadNewNote$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<NewNotepadObjectAction>>(actions.newNote.type),
		map((action): [NewNotepadObjectAction, FlatNotepad] => [action.payload, store.getState().notepads.notepad?.item!]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!insertAction.parent && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) =>
			// Get a note with the new title that is in the expected parent
			Object.values((notepad as FlatNotepad).notes).find(n => n.parent === insertAction.parent && n.title === insertAction.title)
		),
		filterTruthy(),
		map((newNote: Note) => actions.loadNote.started(newNote.internalRef))
	);

const closeNoteOnDeletedParent$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.deleteNotepadObject.type),
		map(() => store.getState().notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),

		// Has the currently opened note been deleted?
		filter(notepad => store.getState().currentNote.ref.length > 0 && !notepad.notes[store.getState().currentNote.ref]),
		map(() => actions.closeNote(undefined))
	);

const loadNoteOnMove$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType<MicroPadAction, Action<MoveNotepadObjectAction>>(actions.moveNotepadObject.type),
		map((action: Action<MoveNotepadObjectAction>) => action.payload),
		filter((payload: MoveNotepadObjectAction) => payload.type === 'note'),
		map((payload: MoveNotepadObjectAction) => actions.loadNote.started(payload.objectRef))
	);

const quickMarkdownInsert$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.quickMarkdownInsert.type),
		map(() => store.getState().currentNote.ref),
		filter(ref => ref.length > 0 && !!store.getState().notepads.notepad && !!store.getState().notepads.notepad!.item),
		map(ref => store.getState().notepads.notepad!.item!.notes[ref]),
		concatMap(note => {
			const id = `markdown${generateGuid()}`;

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

const imagePasted$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.imagePasted.started.type),
		filter(() => store.getState().currentNote.ref.length > 0),
		map(action => action.payload),
		switchMap(imageUrl =>
			from(fetch(imageUrl).then(res => res.blob())).pipe(
				concatMap(image => {
					let id = `image${generateGuid()}`;

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
	loadNote$ as any,
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
