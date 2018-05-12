import { Store } from 'redux';
import { IStoreState } from './types';
import * as mousetrap from 'mousetrap';
import { actions } from './actions';

export function enableKeyboardShortcuts(store: Store<IStoreState>) {
	mousetrap.bind('f', () => store.dispatch(actions.flipFullScreenState(undefined)));
	mousetrap.bind('mod+f', e => {
		e.preventDefault();

		const searchButton = document.getElementById(`search-button`);
		if (!!searchButton) searchButton.click();
	});
}
