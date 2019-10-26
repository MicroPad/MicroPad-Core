import { combineEpics, ofType } from 'redux-observable';
import { concatMap, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { INotepadStoreState } from '../types/NotepadTypes';
import { filterTruthy, isAction } from '../../react-web/util';
import { NewNotepadObjectAction } from '../types/ActionTypes';
import { IStoreState } from '../types';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Observable } from 'rxjs';
import { ThemeValues } from '../../react-web/ThemeValues';

export namespace ExplorerEpics {
	export const expandAll$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			filter((action: Action<void>) => isType(action, actions.expandAllExplorer.started)),
			switchMap(() => state$.pipe(
				take(1),
				map(state => (state.notepads.notepad || <INotepadStoreState> {}).item),
				filterTruthy(),
				map((notepad: FlatNotepad) => [
					...Object.keys(notepad.sections),
					...Object.keys(notepad.notes)
				]),
				map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
			)),
		);

	export const autoLoadNewSection$ = (action$, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.newSection),
			switchMap((action: Action<NewNotepadObjectAction>) => state$.pipe(
				take(1),
				map(state => [action.payload, state.notepads.notepad!.item]),
				filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!notepad),
				map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => {
					const parentRef = insertAction.parent || undefined;

					return Object.values((notepad as FlatNotepad).sections).find(s => s.title === insertAction.title && s.parentRef === parentRef);
				}),
				filterTruthy(),
				map((newSection: FlatSection) => actions.expandSection(newSection.internalRef))
			))
		);

	export const openBreadcrumb$ = (action$: Observable<Action<string>>, state$: Observable<IStoreState>) =>
		action$.pipe(
			ofType<Action<string>>(actions.openBreadcrumb.type),
			map(action => action.payload),
			switchMap(ref => state$.pipe(
				take(1),
				filter(state => !!state.notepads.notepad && !!state.notepads.notepad!.item),
				map(state => {
					const notepadObj: FlatSection | Note = state.notepads.notepad!.item!.notes[ref]
						|| state.notepads.notepad!.item!.sections[ref];

					const notepad = state.notepads.notepad!.item!;
					return [...notepad.pathFrom(notepadObj).slice(1), notepadObj];
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
			))
		);

	export const flashExplorer$ = (action$: Observable<Action<void>>, state$: Observable<IStoreState>) =>
		action$.pipe(
			isAction(actions.flashExplorer),
			switchMap(() => state$.pipe(
				take(1),
				tap(state => {
					const theme = ThemeValues[state.app.theme];
					const explorer = document.getElementById('notepad-explorer')!;

					explorer.style.backgroundColor = theme.accent;
					setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);
				}),
				filter(() => false)
			))
		);

	export const explorerEpics$ = combineEpics(
		expandAll$,
		autoLoadNewSection$,
		openBreadcrumb$,
		flashExplorer$
	);
}
