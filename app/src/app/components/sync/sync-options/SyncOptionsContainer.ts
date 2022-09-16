import { IStoreState } from '../../../types';
import { default as SyncOptionsComponent } from './SyncOptionsComponent';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { actions } from '../../../actions';

export const syncOptionsConnector = connect(mapStateToProps, mapDispatchToProps);

function mapStateToProps({ notepads, sync }: IStoreState) {
	return {
		syncState: sync,
		syncId: notepads?.notepad?.activeSyncId,
		notepad: notepads?.notepad?.item
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		sync: (syncId, notepad) => dispatch(actions.sync({ syncId, notepad })),
		deleteNotepad: syncId => dispatch(actions.deleteFromSync.started(syncId)),
		addNotepad: (user, title) => dispatch(actions.addToSync.started({ user, notepadTitle: title }))
	};
}

export default syncOptionsConnector(SyncOptionsComponent);
