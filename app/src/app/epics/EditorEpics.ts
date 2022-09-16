import { combineEpics, ofType } from 'redux-observable';
import { actions, MicroPadAction } from '../actions';
import { EpicDeps, EpicStore } from './index';
import { from, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { noEmit } from '../util';
import { IStoreState } from '../types';

export const persistSpellCheck$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.toggleSpellCheck.type),
		withLatestFrom(state$),
		map(([,state]) => state.editor.shouldSpellCheck),
		distinctUntilChanged(),
		switchMap(shouldSpellCheck => from(
			getStorage()
				.settingsStorage
				.setItem('shouldSpellCheck', shouldSpellCheck)
				.catch(e => { console.error(e); })
		)),
		noEmit()
	);

export const persistWordWrap$ = (action$: Observable<MicroPadAction>, state$: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType(actions.toggleWordWrap.type),
		withLatestFrom(state$),
		map(([,state]) => state.editor.shouldWordWrap),
		distinctUntilChanged(),
		switchMap(shouldWordWrap => from(
			getStorage()
				.settingsStorage
				.setItem('shouldWordWrap', shouldWordWrap)
				.catch(e => { console.error(e); })
		)),
		noEmit()
	);

export const editorEpics$ = combineEpics<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>(
	persistSpellCheck$,
	persistWordWrap$
);
