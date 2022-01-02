import { combineEpics, ofType } from 'redux-observable';
import { actions, MicroPadAction } from '../actions';
import { Dispatch } from 'redux';
import { EpicDeps, EpicStore } from './index';
import { from, Observable, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { filterTruthy, noEmit } from '../util';
import { UpdateElementAction } from '../types/ActionTypes';
import { Action } from 'redux-typescript-actions';
import { shrinkImage } from '../services/CompressionService';

export const persistSpellCheck$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.toggleSpellCheck.type),
		map(() => store.getState().editor.shouldSpellCheck),
		distinctUntilChanged(),
		switchMap(shouldSpellCheck => from(
			getStorage()
				.settingsStorage
				.setItem('shouldSpellCheck', shouldSpellCheck)
				.catch(e => { console.error(e); })
		)),
		noEmit()
	);

export const persistWordWrap$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction>(actions.toggleWordWrap.type),
		map(() => store.getState().editor.shouldWordWrap),
		distinctUntilChanged(),
		switchMap(shouldWordWrap => from(
			getStorage()
				.settingsStorage
				.setItem('shouldWordWrap', shouldWordWrap)
				.catch(e => { console.error(e); })
		)),
		noEmit()
	);

export const resizeImage$ = (action$: Observable<MicroPadAction>, store: EpicStore, { getStorage }: EpicDeps) =>
	action$.pipe(
		ofType<MicroPadAction, Action<UpdateElementAction>>(actions.updateElement.type),
		// Don't mess with a new upload, there will be a follow-on plain update in a sec
		filter(({ payload: p }) => p.element.type === 'image' && !!p.element.args.ext && !!p.newAsset),
		debounceTime(1000),
		switchMap(action => from(getStorage().assetStorage.getItem<Blob>(action.payload.element.args.ext!)).pipe(
			filterTruthy(),
			switchMap(imageBlob => shrinkImage(imageBlob, action.payload.element)),
			map()
		))
	);

export const editorEpics$ = combineEpics<MicroPadAction, Dispatch, EpicDeps>(
	persistSpellCheck$,
	persistWordWrap$,
	resizeImage$
);
