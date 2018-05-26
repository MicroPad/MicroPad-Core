import { Store } from 'redux';
import { IStoreState } from './types';
import * as mousetrap from 'mousetrap';
import { actions } from './actions';
import { INotepadStoreState } from './types/NotepadTypes';

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

	// Export Notepad
	mousetrap.bind('mod+s', e => {
		e.preventDefault();

		if (!!(store.getState().notepads.notepad || <INotepadStoreState> {}).item) store.dispatch(actions.exportNotepad(undefined));
	});

	// Export All Notepads
	mousetrap.bind('mod+shift+s', e => {
		e.preventDefault();
		document.getElementById('export-all-notepads-trigger')!.click();
	});

	// Import Notepad(s)
	mousetrap.bind('mod+o', e => {
		e.preventDefault();
		document.getElementById('upload-notepad-input')!.click();
	});

	mousetrap.bind('mod+p', e => {
		e.preventDefault();
		store.dispatch(actions.print.started(undefined));
	});
}
