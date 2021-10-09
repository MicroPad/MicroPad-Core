import { Store } from 'redux';
import { IStoreState } from '../types';
import * as mousetrap from 'mousetrap';
import { actions, MicroPadAction } from '../actions';
import { openModal } from '../util';

export function enableKeyboardShortcuts(store: Store<IStoreState, MicroPadAction>) {
	// Fullscreen
	mousetrap.bind('f', () => store.dispatch(actions.flipFullScreenState(undefined)));

	// Search
	mousetrap.bind('mod+f', e => {
		e.preventDefault();
		openModal('search-modal');
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

		if (store.getState().notepads?.notepad?.item) {
			store.dispatch(actions.exportNotepad(undefined));
		}
	});

	// Export All Notepads
	mousetrap.bind('mod+shift+s', e => {
		e.preventDefault();
		openModal('export-all-notepads-modal');
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
