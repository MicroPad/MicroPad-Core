import { connect } from 'react-redux';
import HelpMessageComponent, { IHelpMessageComponentLocalProps } from './HelpMessageComponent';
import { IStoreState } from '../../types';
import { actions } from '../../actions';

export const helpMessageConnector = connect(
	(state: IStoreState, { message, video }: IHelpMessageComponentLocalProps) => ({
		message,
		video,
		show: state.app.showHelp
	}),
	dispatch => ({
		hide: pref => dispatch(actions.setHelpPref(pref))
	})
);

export default helpMessageConnector(HelpMessageComponent);
