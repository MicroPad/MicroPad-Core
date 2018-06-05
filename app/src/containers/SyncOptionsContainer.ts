import { IStoreState } from '../types';
import { INotepadsStoreState, INotepadStoreState } from '../types/NotepadTypes';
import { default as SyncOptionsComponent, ISyncOptionsComponentProps } from '../components/sync/SyncOptionsComponent';
import { Action } from 'redux';
import { connect, Dispatch } from 'react-redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads, sync }: IStoreState) {
	return {
		syncState: sync,
		syncId: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).activeSyncId,
		notepad: ((notepads || <INotepadsStoreState> {}).notepad || <INotepadStoreState> {}).item
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<ISyncOptionsComponentProps> {
	return {
		sync: (syncId, notepad) => dispatch(actions.sync({ syncId, notepad })),
		deleteNotepad: syncId => dispatch(actions.deleteFromSync.started(syncId)),
		addNotepad: user => dispatch(actions.addToSync.started(user))
	};
}

export default connect<ISyncOptionsComponentProps>(mapStateToProps, mapDispatchToProps)(SyncOptionsComponent);
