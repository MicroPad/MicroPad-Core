import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import { default as ManageSyncComponent, IManageSyncComponentProps } from '../components/sync/ManageSyncComponent';
import { actions } from '../actions';

export function mapStateToProps({ sync }: IStoreState) {
	return {
		syncState: sync
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IManageSyncComponentProps> {
	return {
		logout: () => dispatch(actions.syncLogout(undefined))
	};
}

export default connect<IManageSyncComponentProps>(mapStateToProps, mapDispatchToProps)(ManageSyncComponent);
