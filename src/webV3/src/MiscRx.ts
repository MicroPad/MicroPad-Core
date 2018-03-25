import { Observable } from 'rxjs/Observable';
import { Store } from 'redux';
import { IStoreState } from './types';
import { INotepad, INotepadStoreState } from './types/NotepadTypes';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { actions } from './actions';
import { from } from 'rxjs/observable/from';
import { stringify } from './util';
import * as md5 from 'md5';
import { format } from 'date-fns';

export class MiscRx {
	private store: Store<IStoreState>;
	private state$: Observable<IStoreState>;
	private lastNotepadHash: string;
	private lastNotepadTitle: string;

	constructor(store: Store<IStoreState>) {
		this.store = store;
		this.state$ = from(<any> store);
		this.lastNotepadHash = '';
		this.lastNotepadTitle = '';
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
				filter(([notepad, newHash]: [INotepad, string]) => {
					const condition = this.lastNotepadHash !== newHash && notepad.title === this.lastNotepadTitle;
					this.lastNotepadTitle = notepad.title;

					return condition;
				}),
				tap(([notepad, newHash]: [INotepad, string]) => this.lastNotepadHash = newHash),
				map(([notepad]: [INotepad, string]) => {
					return {
						...notepad,
						lastModified: format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSSZ')
					};
				})
			)
			.subscribe((notepad: INotepad) => this.store.dispatch(actions.saveNotepad.started(notepad)));
	}
}
