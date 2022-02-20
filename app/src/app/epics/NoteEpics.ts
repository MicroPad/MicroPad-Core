import { combineEpics, ofType } from 'redux-observable';
import { concatMap, filter, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { filterTruthy, generateGuid } from '../util';
import { MoveNotepadObjectAction, NewNotepadObjectAction, UpdateElementAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist/index';
import { NoteElement } from 'upad-parse/dist/Note';
import { ASSET_STORAGE } from '../root';
import { EpicDeps, EpicStore } from './index';

const loadNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { notificationService }: EpicDeps) =>
	action$.pipe(
		ofType(actions.loadNote.started.type),
		tap(() => notificationService.dismissToasts()),
		withLatestFrom(state$),
		map(([action, state]): [string, FlatNotepad] => [(action as MicroPadActions['loadNote']['started']).payload, state.notepads.notepad?.item!]),
		filter(([ref, notepad]: [string, FlatNotepad]) => !!ref && !!notepad),
		map(([ref, notepad]: [string, FlatNotepad]) => ({ ref: ref, note: notepad.notes[ref] })),
		mergeMap(({ ref, note }: { ref: string, note: Note | undefined }) => {
			if (note) {
				return [
					actions.expandFromNote({
						note,
						notepad: state$.value.notepads.notepad!.item!
					}), actions.checkNoteAssets.started([note.internalRef, note.elements])
				];
			}

			const error = new Error(`MicroPad couldn't load the current note (handled in loadNote$)`);
			console.error(error);
			return [actions.loadNote.failed({ params: ref, error })];
		})
	);

const checkNoteAssets$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.checkNoteAssets.started.type),
		map((action): [string, NoteElement[]] => (action as MicroPadActions['checkNoteAssets']['started']).payload),
		switchMap(([ref, elements]) =>
			from(getNoteAssets(elements))
				.pipe(map((res): [string, NoteElement[], object] => [ref, res.elements, res.blobUrls]))
		),
		map(([ref, elements, blobUrls]: [string, NoteElement[], object]): [string, NoteElement[], object, FlatNotepad] => [ref, elements, blobUrls, state$.value.notepads.notepad?.item!]),
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

const binaryElementUpdate$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.updateElement.type),
		map(action => (action as MicroPadActions['updateElement']).payload),
		filter((params: UpdateElementAction) => !!params.newAsset),
		map(params => {
			if (params.newAsset!.type !== 'image/gif') return params;
			return {
				...params,
				element: {
					...params.element,
					args: { ...params.element.args, canOptimise: false }
				}
			};
		}),
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
			actions.reloadNote()
		])
	);

const reloadNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.reloadNote.type),
		map(() => state$.value),
		map((state: IStoreState) => state.currentNote.ref),
		filter((noteRef: string) => !!noteRef && noteRef.length > 0),
		map((noteRef: string) => actions.loadNote.started(noteRef))

	);

const autoLoadNewNote$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.newNote.type),
		map((action): [NewNotepadObjectAction, FlatNotepad] => [(action as MicroPadActions['newNote']).payload, state$.value.notepads.notepad?.item!]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!insertAction.parent && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) =>
			// Get a note with the new title that is in the expected parent
			Object.values((notepad as FlatNotepad).notes).find(n => n.parent === insertAction.parent && n.title === insertAction.title)
		),
		filterTruthy(),
		map((newNote: Note) => actions.loadNote.started(newNote.internalRef))
	);

const closeNoteOnDeletedParent$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.deleteNotepadObject.type),
		map(() => state$.value.notepads.notepad),
		filterTruthy(),
		map((notepadState: INotepadStoreState) => notepadState.item),
		filterTruthy(),

		// Has the currently opened note been deleted?
		filter(notepad => state$.value.currentNote.ref.length > 0 && !notepad.notes[state$.value.currentNote.ref]),
		map(() => actions.closeNote())
	);

const loadNoteOnMove$ = (action$: Observable<MicroPadAction>) =>
	action$.pipe(
		ofType(actions.moveNotepadObject.type),
		map((action) => (action as MicroPadActions['moveNotepadObject']).payload),
		filter((payload: MoveNotepadObjectAction) => payload.type === 'note'),
		map((payload: MoveNotepadObjectAction) => actions.loadNote.started(payload.objectRef))
	);

const quickMarkdownInsert$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.quickMarkdownInsert.type),
		switchMap(() => state$.pipe(
			take(1),
			filter(state => !!state.currentNote.ref.length),
			concatMap(state => {
				const element: NoteElement = {
					type: 'markdown',
					content: '',
					args: {
						id: 'markdown' + generateGuid(),
						x: state.app.cursorPos.x + 'px',
						y: state.app.cursorPos.y + 'px',
						width: 'auto',
						height: 'auto',
						ext: generateGuid(),
						fontSize: state.app.defaultFontSize
					}
				};

				return [
					actions.insertElement({
						noteRef: state.currentNote.ref,
						element
					}),
					actions.openEditor(element.args.id)
				];
			})
		))
	);

const imagePasted$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.filePasted.type),
		map(action => (action as MicroPadActions['filePasted']).payload),
		switchMap(file => state$.pipe(
			take(1),
			filter(state => !!state.currentNote.ref.length),
			concatMap(state => {
				const type = file.type.startsWith('image/') ? 'image' : 'file';
				const id = type + generateGuid();
				const element: NoteElement = {
					type,
					content: 'AS',
					args: {
						id,
						x: state.app.cursorPos.x + 'px',
						y: state.app.cursorPos.y + 'px',
						width: 'auto',
						height: 'auto',
						ext: generateGuid(),
						filename: file.name
					}
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
						newAsset: file
					})
				];
			})
		))
	);

export const noteEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	loadNote$,
	checkNoteAssets$,
	binaryElementUpdate$,
	reloadNote$,
	autoLoadNewNote$,
	closeNoteOnDeletedParent$,
	loadNoteOnMove$,
	quickMarkdownInsert$,
	imagePasted$
);

function getNoteAssets(elements: NoteElement[]): Promise<{ elements: NoteElement[], blobUrls: object }> {
	const storageRequests: Promise<Blob | null>[] = [];
	const blobRefs: string[] = [];

	elements = elements.map(element => {
		// Is this a notebook before v2?
		if (element.type !== 'markdown' && element.content !== 'AS') {
			const asset = new Asset(dataURItoBlob(element.content));
			storageRequests.push(ASSET_STORAGE.setItem<Blob>(asset.uuid, asset.data));
			blobRefs.push(asset.uuid);

			return { ...element, args: { ...element.args, ext: asset.uuid }, content: 'AS' };
		}

		// Notebooks from v2 or higher
		if (!!element.args.ext) {
			storageRequests.push(
				ASSET_STORAGE.getItem<Blob>(element.args.ext)
					.then(blob => {
						if (!blob) return null;

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
			.then((blobs: Array<Blob | null>) => {
				const blobUrls = {};
				blobs.forEach((blob, i) => {
					if (!blob) return;
					blobUrls[blobRefs[i]] = URL.createObjectURL(blob);
				});

				resolve({
					elements,
					blobUrls
				});
			})
	);
}

// Thanks to http://stackoverflow.com/a/12300351/998467
function dataURItoBlob(dataURI: string) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	let byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// write the bytes of the string to an ArrayBuffer
	let ab = new ArrayBuffer(byteString.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	return new Blob([ab], { type: mimeString });
}
