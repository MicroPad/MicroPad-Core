import { combineEpics } from 'redux-observable';
import { getAsBase64, getNotepadObjectByRef, isAction } from '../util';
import { actions } from '../actions';
import { filter, map, switchMap } from 'rxjs/operators';
import { IMarkdownNote, INote, INotepad, INotepadStoreState, NoteElement } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import { ASSET_STORAGE } from '../index';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { trim } from '../components/note-viewer/elements/drawing/trim-canvas';

export namespace PrintEpics {
	export const generateMarkdownForPrint$ = (action$, store) =>
		action$.pipe(
			isAction(actions.print.started),
			map(() => store.getState()),
			map((state: IStoreState) => [(state.notepads.notepad || <INotepadStoreState> {}).item, state.currentNote.ref]),
			filter(([notepad, noteRef]: [INotepad, string]) => !!notepad && !!noteRef),
			map(([notepad, noteRef]: [INotepad, string]) => {
				let note: INote | undefined = undefined;
				getNotepadObjectByRef(notepad, noteRef, obj => note = <INote> obj);

				return note;
			}),
			filter((note: INote) => !!note),
			switchMap((note: INote) =>
				fromPromise((async () => {
					const resolvedAssets = await Promise.all(note.elements
						.filter(e => e.type === 'drawing' || e.type === 'image')
						.filter(e => !!e.args.ext)
						.map(async e => {
							const blob: Blob = <Blob> await ASSET_STORAGE.getItem(e.args.ext!);
							const b64 = (e.type === 'drawing') ? await getTrimmedDrawing(blob) : await getAsBase64(blob);
							return { uuid: e.args.ext!, b64 };
						}));

					const assetsObj = {};
					resolvedAssets.forEach(a => assetsObj[a.uuid] = a.b64);

					return [
						note,
						assetsObj
					];
				})())
			),
			map(([note, assets]: [INote, object]) => (<INote> note).toMarkdown(assets)),
			map((mdNote: IMarkdownNote) => <NoteElement> {
				content: mdNote.md,
				args: {
					id: 'markdown1_print',
					width: 'auto',
					height: 'auto',
					fontSize: (<IStoreState> store.getState()).meta.defaultFontSize,
					x: '0px',
					y: '0px'
				},
				type: 'markdown'
			}),
			map((element: NoteElement) => actions.print.done({ params: undefined, result: element }))
		);

	export const printEpics$ = combineEpics(
		generateMarkdownForPrint$
	);

	function getTrimmedDrawing(blob: Blob): Promise<string> {
		return new Promise<string>(resolve => {
			const img = new Image();

			img.onload = () => {
				const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
				tmpCanvas.setAttribute('width', img.naturalWidth.toString());
				tmpCanvas.setAttribute('height', img.naturalHeight.toString());

				const tmpContext = tmpCanvas.getContext('2d')!;
				tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
				tmpContext.drawImage(img, 0, 0);

				URL.revokeObjectURL(img.src);
				resolve((trim(tmpCanvas).toDataURL()));
			};

			img.src = URL.createObjectURL(blob);
		});
	}
}
