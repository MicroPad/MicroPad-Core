import { combineEpics } from 'redux-observable';
import { concatMap, filter, map, startWith, tap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { isAction } from '../util';
import { NewNotepadObjectAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Observable } from 'rxjs';
import { Store } from 'redux';
import { ThemeValues } from '../ThemeValues';

export const expandAll$ = (action$, store) =>
	action$.pipe(
		filter((action: Action<void>) => isType(action, actions.expandAllExplorer.started)),
		map(() => (store.getState().notepads.notepad || <INotepadStoreState> {}).item),
		filter(Boolean),
		map((notepad: FlatNotepad) => [
			...Object.keys(notepad.sections),
			...Object.keys(notepad.notes)
		]),
		map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
	);

export const autoLoadNewSection$ = (action$, store) =>
	action$.pipe(
		isAction(actions.newSection),
		map((action: Action<NewNotepadObjectAction>) => [action.payload, (<IStoreState> store.getState()).notepads.notepad!.item]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => {
			const parentRef = insertAction.parent || undefined;

			return Object.values((notepad as FlatNotepad).sections).find(s => s.title === insertAction.title && s.parentRef === parentRef);
		}),
		filter(Boolean),
		map((newSection: FlatSection) => actions.expandSection(newSection.internalRef))
	);

export const openBreadcrumb$ = (action$: Observable<Action<string>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.openBreadcrumb),
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
		),
		tap(a => console.log(a))
	);

export const flashExplorer$ = (action$: Observable<Action<void>>, store: Store<IStoreState>) =>
	action$.pipe(
		isAction(actions.flashExplorer),
		tap(() => {
			const theme = ThemeValues[store.getState().app.theme];
			const explorer = document.getElementById('notepad-explorer')!;

			explorer.style.backgroundColor = theme.accent;
			setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);
		}),
		filter(() => false)
	);

export const explorerEpics$ = combineEpics(
	expandAll$,
	autoLoadNewSection$,
	openBreadcrumb$,
	flashExplorer$ as any
);
