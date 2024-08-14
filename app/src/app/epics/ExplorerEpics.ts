import { combineEpics, ofType } from 'redux-observable';
import { concatMap, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { actions, MicroPadAction, MicroPadActions } from '../actions';
import { filterTruthy, noEmit } from '../util';
import { NewNotepadObjectAction } from '../types/ActionTypes';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Observable } from 'rxjs';
import { ThemeValues } from '../ThemeValues';
import { EpicDeps, EpicStore } from './index';
import { IStoreState } from '../types';

export const expandAll$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.expandAllExplorer.started.type),
		withLatestFrom(state$),
		map(([,state]) => state.notepads.notepad?.item),
		filterTruthy(),
		map((notepad: FlatNotepad) => [
			...Object.keys(notepad.sections),
			...Object.keys(notepad.notes)
		]),
		map((allRefs: string[]) => actions.expandAllExplorer.done({ params: undefined, result: allRefs }))
	);

export const autoLoadNewSection$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.newSection.type),
		withLatestFrom(state$),
		map(([action, state]): [NewNotepadObjectAction, FlatNotepad] => [
			(action as MicroPadActions['newSection']).payload,
			state.notepads.notepad!.item!
		]),
		filter(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => !!insertAction && !!notepad),
		map(([insertAction, notepad]: [NewNotepadObjectAction, FlatNotepad]) => {
			const parentRef = insertAction.parent || undefined;

			return Object.values((notepad as FlatNotepad).sections).find(s => s.title === insertAction.title && s.parentRef === parentRef);
		}),
		filterTruthy(),
		map((newSection: FlatSection) => actions.expandSection(newSection.internalRef))
	);

export const openBreadcrumb$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.openBreadcrumb.type),
		map(action => (action as MicroPadActions['openBreadcrumb']).payload),
		withLatestFrom(state$),
		filter(([,state]) => !!state.notepads.notepad?.item),
		map(([ref, state]) => {
			const notepadObj: FlatSection | Note = state.notepads.notepad!.item!.notes[ref]
			|| state.notepads.notepad!.item!.sections[ref];

			const notepad = state.notepads.notepad!.item!;
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

export const flashExplorer$ = (action$: Observable<MicroPadAction>, state$: EpicStore) =>
	action$.pipe(
		ofType(actions.flashExplorer.type),
		withLatestFrom(state$),
		tap(([,state]) => {
			const theme = ThemeValues[state.app.theme];
			const explorer: HTMLDivElement = document.querySelector('.notepad-explorer')!;

			explorer.style.backgroundColor = theme.accent;
			setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);
		}),
		noEmit()
	);

export const explorerEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	expandAll$,
	autoLoadNewSection$,
	openBreadcrumb$,
	flashExplorer$
);
