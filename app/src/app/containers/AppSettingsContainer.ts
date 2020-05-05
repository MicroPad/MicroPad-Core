import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import AppSettingsComponent, { IAppSettingsComponentProps } from '../components/explorer/AppSettingsComponent';

export function mapStateToProps({}: IStoreState): IAppSettingsComponentProps {
	return {};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IAppSettingsComponentProps> {
	return {
		clearOldData: () => dispatch(actions.clearOldData.started())
	};
}

export default connect<IAppSettingsComponentProps, Partial<IAppSettingsComponentProps>, {}, IStoreState>(mapStateToProps, mapDispatchToProps)(AppSettingsComponent);
