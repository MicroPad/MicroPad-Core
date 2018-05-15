import { Store } from 'redux';
import { IStoreState } from './types';
import * as mousetrap from 'mousetrap';
import { actions } from './actions';

export function enableKeyboardShortcuts(store: Store<IStoreState>) {
	// Fullscreen
	mousetrap.bind('f', () => store.dispatch(actions.flipFullScreenState(undefined)));

	// Search
	mousetrap.bind('mod+f', e => {
		e.preventDefault();

		const searchButton = document.getElementById(`search-button`);
		if (!!searchButton) searchButton.click();
	});

	// Quick Notepad Switch
	Array.from(Array(9).keys()).map(n => n + 1).forEach(n => {
		mousetrap.bind(`mod+${n}`, e => {
			e.preventDefault();

			store.dispatch(actions.loadNotepadByIndex(n));
		});
	});
}
