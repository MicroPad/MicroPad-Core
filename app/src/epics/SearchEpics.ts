import { combineEpics } from 'redux-observable';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { Action, isType } from 'redux-typescript-actions';
import { actions } from '../actions';
import { FlatNotepad, Translators } from 'upad-parse/dist';
import { HashTagSearchResult, HashTagSearchResults } from '../reducers/SearchReducer';

export namespace SearchEpics {
	export const search$ = (action$, _, { getStorage }: { getStorage: () => { [name: string]: LocalForage } }) =>
		action$.pipe(
			filter((action: Action<string>) => isType(action, actions.search)),
			map((action: Action<string>) => action.payload),
			debounceTime(100),
			switchMap((query: string) => from((async () => {
				if (query.length <= 1 || query.substring(0, 1) !== '#') return actions.displayHashTagSearchResults({});

				// Get all the notepads we have saved
				const notepads: FlatNotepad[] = [];
				await getStorage().notepadStorage.iterate((json: string) => {
					try {
						notepads.push(Translators.Json.toNotepadFromNotepad(json).flatten());
					} catch (e) {
						console.warn(`Couldn't parse notepad: ${e}`);
					}
					return;
				});

				// Create a data structure with each notepad being the key to all the results for that hashtag's search
				const results: HashTagSearchResults = {};
				notepads
					.forEach(notepad =>
						notepad.search(query)
							.map(note => {
								return {
									title: note.title,
									parentTitle: notepad.sections[note.parent as string].title,
									noteRef: note.internalRef
								} as HashTagSearchResult;
							})
							.forEach(result => results[notepad.title] = [
								...(results[notepad.title] || []),
								result
							])
					);

				// Search all of the notepads
				return actions.displayHashTagSearchResults(results);
			})()))
		);

	export const searchEpics$ = combineEpics(
		search$
	);
}
