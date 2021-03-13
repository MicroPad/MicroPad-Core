import { IStoreState } from '../types';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { default as SyncOptionsComponent, ISyncOptionsComponentProps } from '../components/sync/SyncOptionsComponent';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads, sync }: IStoreState) {
	return {
		syncState: sync,
		syncId: ((notepads || {} as INotepadsStoreState).notepad || {} as INotepadStoreState).activeSyncId,
		notepad: ((notepads || {} as INotepadsStoreState).notepad || {} as INotepadStoreState).item
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISyncOptionsComponentProps> {
	return {
		sync: (syncId, notepad) => dispatch(actions.sync({ syncId, notepad })),
		deleteNotepad: syncId => dispatch(actions.deleteFromSync.started(syncId)),
		addNotepad: (user, title) => dispatch(actions.addToSync.started({ user, notepadTitle: title }))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(SyncOptionsComponent);
