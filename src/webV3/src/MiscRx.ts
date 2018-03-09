import { Observable } from 'rxjs/Observable';
import { Store } from 'redux';
import { IStoreState } from './types';
import { INotepad, INotepadStoreState } from './types/NotepadTypes';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { actions } from './actions';
import { from } from 'rxjs/observable/from';
import * as deepEqual from 'deep-equal'; // tslint:disable-line

export class MiscRx {
	private store: Store<IStoreState>;
	private state$: Observable<IStoreState>;

	constructor(store: Store<IStoreState>) {
		this.store = store;
		this.state$ = from(<any> store);
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
				distinctUntilChanged((obj1, obj2) => deepEqual(obj1, obj2, { strict: true })),
				debounceTime(1000)
			)
			.subscribe((notepad: INotepad) => this.store.dispatch(actions.saveNotepad.started(notepad)));
	}
}
