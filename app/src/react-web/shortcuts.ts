import { Store } from 'redux';
import { IStoreState } from '../core/types';
import * as mousetrap from 'mousetrap';
import { actions } from '../core/actions';
import { INotepadStoreState } from '../core/types/NotepadTypes';
import { Action } from 'redux-typescript-actions';

export function enableKeyboardShortcuts(store: Store<IStoreState, Action<any>>) {
	// Fullscreen
	mousetrap.bind('f', () => store.dispatch(actions.flipFullScreenState(undefined)));

	// Search
	mousetrap.bind('mod+f', e => {
		e.preventDefault();

		const searchButton = document.querySelector(`#search-button > a`) as HTMLAnchorElement;
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
		(document.querySelector('#export-all-notepads-trigger > a')! as HTMLAnchorElement).click();
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

	// Help
	mousetrap.bind('f1', e => {
		e.preventDefault();
		store.dispatch(actions.getHelp.started());
	});

	// Quick Actions
	mousetrap.bind('n', e => {
		e.preventDefault();

		if (store.getState().currentNote.ref.length > 0) {
			// In a note, insert markdown
			store.dispatch(actions.quickMarkdownInsert(undefined));
		} else if (!!store.getState().notepads.notepad && !!store.getState().notepads.notepad!.item) {
			// In a notepad, insert a note
			store.dispatch(actions.quickNote.started(undefined));
		} else {
			// Outside of a notepad, make a notepad
			store.dispatch(actions.quickNotepad(undefined));
		}
	});
}
