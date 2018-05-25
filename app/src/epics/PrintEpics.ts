import { combineEpics } from 'redux-observable';
import { getNotepadObjectByRef, isAction } from '../util';
import { actions } from '../actions';
import { filter, map, switchMap } from 'rxjs/operators';
import { INote, INotepad, INotepadStoreState } from '../types/NotepadTypes';
import { IStoreState } from '../types';
import { ASSET_STORAGE } from '../index';
import { fromPromise } from 'rxjs/observable/fromPromise';

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
						.map(e => e.args.ext)
						.map(async uuid => {
							const b64 = await getAsBase64(<Blob> await ASSET_STORAGE.getItem(uuid!));
							return { uuid: uuid!, b64 };
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
			map((md: string) => actions.print.done({ params: undefined, result: md }))
		);

	export const printEpics$ = combineEpics(
		generateMarkdownForPrint$
	);

	function getAsBase64(blob: Blob): Promise<string> {
		return new Promise<string>(resolve => {
			try {
				const reader = new FileReader();
				reader.onload = event => resolve(event.target!.result);
				reader.readAsDataURL(blob);
			} catch (e) {
				console.error(e);
				resolve('');
			}
		});
	}
}
