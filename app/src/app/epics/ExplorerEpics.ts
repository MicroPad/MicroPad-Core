import { combineEpics, ofType } from 'redux-observable';
import { concatMap, filter, map, tap } from 'rxjs/operators';
import { Action } from 'redux-typescript-actions';
import { actions, MicroPadAction } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { filterTruthy, noEmit } from '../util';
import { NewNotepadObjectAction } from '../types/ActionTypes';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Observable } from 'rxjs';
import { ThemeValues } from '../ThemeValues';
import { EpicStore } from './index';

export const expandAll$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.expandAllExplorer.started.type),
		map(() => (store.getState().notepads.notepad || {} as INotepadStoreState).item),
		filterTruthy(),
		map((notepad: FlatNotepad) => [
			...Object.keys(notepad.sections),
			...Object.keys(notepad.notes)
		]),
		map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
	);

export const autoLoadNewSection$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<NewNotepadObjectAction>>(actions.newSection.type),
		map((action: Action<NewNotepadObjectAction>): [NewNotepadObjectAction, FlatNotepad] => [action.payload, store.getState().notepads.notepad?.item!]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => {
			const parentRef = insertAction.parent || undefined;

			return Object.values((notepad as FlatNotepad).sections).find(s => s.title === insertAction.title && s.parentRef === parentRef);
		}),
		filterTruthy(),
		map((newSection: FlatSection) => actions.expandSection(newSection.internalRef))
	);

export const openBreadcrumb$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction, Action<string>>(actions.openBreadcrumb.type),
		map(action => action.payload),
		filter(() => !!store.getState().notepads.notepad && !!store.getState().notepads.notepad!.item),
		map((ref: string) =>
			store.getState().notepads.notepad!.item!.notes[ref]
			|| store.getState().notepads.notepad!.item!.sections[ref]
		),
		map((notepadObj: FlatSection | Note) => {
			const notepad = store.getState().notepads.notepad!.item!;
			return [...notepad.pathFrom(notepadObj).slice(1) as Array<FlatSection | Note>, notepadObj];
		}),
		concatMap((path: Array<FlatSection | Note>) =>
			[
				actions.exitFullScreen(),
				actions.collapseAllExplorer(),
				...path
					.filter(obj => !(obj as Note).parent)
					.map(section => actions.expandSection(section.internalRef)),
				actions.flashExplorer()
			]
		)
	);

export const flashExplorer$ = (action$: Observable<MicroPadAction>, store: EpicStore) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.flashExplorer.type),
		tap(() => {
			const theme = ThemeValues[store.getState().app.theme];
			const explorer: HTMLDivElement = document.querySelector('.notepad-explorer')!;

			explorer.style.backgroundColor = theme.accent;
			setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);
		}),
		noEmit()
	);

export const explorerEpics$ = combineEpics(
	expandAll$,
	autoLoadNewSection$,
	openBreadcrumb$,
	flashExplorer$ as any
);
