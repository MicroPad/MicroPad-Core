import { IStoreState } from '../../core/types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../../core/actions';
import AppSettingsComponent, { IAppSettingsComponentProps } from '../components/explorer/AppSettingsComponent';

export function mapStateToProps({}: IStoreState): IAppSettingsComponentProps {
	return {};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IAppSettingsComponentProps> {
	return {
		clearOldData: () => dispatch(actions.clearOldData.started())
	};
}

export default connect<IAppSettingsComponentProps>(mapStateToProps, mapDispatchToProps)(AppSettingsComponent);
