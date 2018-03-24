import { Observable } from 'rxjs/Observable';
import { Store } from 'redux';
import { IStoreState } from './types';
import { INotepad, INotepadStoreState } from './types/NotepadTypes';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { actions } from './actions';
import { from } from 'rxjs/observable/from';
import { stringify } from './util';
import * as md5 from 'md5';

export class MiscRx {
	private store: Store<IStoreState>;
	private state$: Observable<IStoreState>;
	private lastNotepadHash: string;

	constructor(store: Store<IStoreState>) {
		this.store = store;
		this.state$ = from(<any> store);
		this.lastNotepadHash = '';
	}

	public initSubscriptions() {
		this.saveNotepadOnChanges();
	}

	private saveNotepadOnChanges() {
		this.state$
			.pipe(
				map((state: IStoreState) => state.notepads.notepad),
				filter(Boolean),
				map((notepadState: INotepadStoreState) => notepadState.item),
				filter(Boolean),
				debounceTime(1000),
				map((notepad: INotepad) => [notepad, md5(stringify(notepad))]),
				filter(([notepad, newHash]: [INotepad, string]) => this.lastNotepadHash !== newHash),
				tap(([notepad, newHash]: [INotepad, string]) => this.lastNotepadHash = newHash),
				map(([notepad]: [INotepad, string]) => notepad)
			)
			.subscribe((notepad: INotepad) => this.store.dispatch(actions.saveNotepad.started(notepad)));
	}
}
