import { combineEpics } from 'redux-observable';
import { dataURItoBlob, filterTruthy, isAction } from '../util';
import { actions } from '../../core/actions';
import { filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { INotepadStoreState } from '../../core/types/NotepadTypes';
import { IStoreState } from '../../core/types';
import { ASSET_STORAGE } from '..';
import { trim } from '../components/note-viewer/elements/drawing/trim-canvas';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist';
import { MarkdownNote, NoteElement } from 'upad-parse/dist/Note';
import { from, Observable } from 'rxjs';

export namespace PrintEpics {
	export const generateMarkdownForPrint$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.print.started),
			switchMap(() => state$.pipe(
				take(1),
				map((state: IStoreState) => [(state.notepads.notepad || <INotepadStoreState> {}).item, state.currentNote.ref]),
				filter(([notepad, noteRef]: [FlatNotepad, string]) => !!notepad && !!noteRef),
				map(([notepad, noteRef]: [FlatNotepad, string]) => notepad.notes[noteRef]),
				filterTruthy(),
				switchMap((note: Note) =>
					from((async () => {
						const resolvedAssets = await Promise.all(note.elements
							.filter(e => e.type === 'drawing' || e.type === 'image')
							.filter(e => !!e.args.ext)
							.map(async e => {
								const blob: Blob = <Blob> await ASSET_STORAGE.getItem(e.args.ext!);
								const data = (e.type === 'drawing') ? dataURItoBlob(await getTrimmedDrawing(blob)) : blob;
								return { uuid: e.args.ext!, data };
							}));

						const assets: Asset[] = resolvedAssets.map(res => new Asset(res.data, res.uuid));

						return [
							note,
							assets
						];
					})())
				),
				switchMap(([note, assets]: [Note, Asset[]]) => from((note as Note).toMarkdown(assets))),
				withLatestFrom(state$),
				map(([mdNote, state]: [MarkdownNote, IStoreState]) => <NoteElement> {
					content: mdNote.md,
					args: {
						id: 'markdown1_print',
						width: 'auto',
						height: 'auto',
						fontSize: state.app.defaultFontSize,
						x: '0px',
						y: '0px'
					},
					type: 'markdown'
				}),
				map((element: NoteElement) => actions.print.done({ params: undefined, result: element }))
			))
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
