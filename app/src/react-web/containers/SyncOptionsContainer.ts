import { IStoreState } from '../../core/types';
import { INotepadsStoreState, INotepadStoreState } from '../../core/types/NotepadTypes';
import { default as SyncOptionsComponent, ISyncOptionsComponentProps } from '../components/sync/SyncOptionsComponent';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { actions } from '../../core/actions';

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
		addNotepad: (user, title) => dispatch(actions.addToSync.started({ user, notepadTitle: title }))
	};
}

export default connect<ISyncOptionsComponentProps>(mapStateToProps, mapDispatchToProps)(SyncOptionsComponent);
