import { IStoreState } from '../../core/types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { default as ManageSyncComponent, IManageSyncComponentProps } from '../components/sync/ManageSyncComponent';
import { actions } from '../../core/actions';

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
