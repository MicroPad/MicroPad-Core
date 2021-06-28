import { combineEpics, ofType } from 'redux-observable';
import { dataURItoBlob, filterTruthy } from '../util';
import { actions, MicroPadAction } from '../actions';
import { filter, map, switchMap } from 'rxjs/operators';
import { IStoreState } from '../types';
import { trim } from '../components/note-viewer/elements/drawing/trim-canvas';
import { Asset, FlatNotepad, Note } from 'upad-parse/dist';
import { MarkdownNote, NoteElement } from 'upad-parse/dist/Note';
import { from, Observable } from 'rxjs';
import { ASSET_STORAGE } from '../root';
import { EpicStore } from './index';

export const generateMarkdownForPrint$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.print.started.type),
		map(() => store.getState()),
		map((state: IStoreState): [FlatNotepad, string] => [state.notepads.notepad?.item!, state.currentNote.ref]),
		filter(([notepad, noteRef]: [FlatNotepad, string]) => !!notepad && !!noteRef),
		map(([notepad, noteRef]: [FlatNotepad, string]) => notepad.notes[noteRef]),
		filterTruthy(),
		switchMap((note: Note) =>
			from((async () => {
				const resolvedAssets = await Promise.all(note.elements
					.filter(e => e.type === 'drawing' || e.type === 'image')
					.filter(e => !!e.args.ext)
					.map(async e => {
						const blob: Blob = await ASSET_STORAGE.getItem(e.args.ext!) as Blob;
						const data = (e.type === 'drawing') ? dataURItoBlob(await getTrimmedDrawing(blob)) : blob;
						return { uuid: e.args.ext!, data };
					}));

				const assets: Asset[] = resolvedAssets.map(res => new Asset(res.data, res.uuid));

				return [
					note,
					assets
				] as [Note, Asset[]];
			})())
		),
		switchMap(([note, assets]: [Note, Asset[]]) => from((note as Note).toMarkdown(assets))),
		map((mdNote: MarkdownNote) => ({
			content: mdNote.md,
			args: {
				id: 'markdown1_print',
				width: 'auto',
				height: 'auto',
				fontSize: '12pt',
				x: '0px',
				y: '0px'
			},
			type: 'markdown'
		} as NoteElement)),
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
