import { IStoreState } from '../types';
import {
	default as HelpMessageComponent,
	IHelpMessageComponentLocalProps,
	IHelpMessageComponentProps
} from '../components/HelpMessageComponent';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ meta }: IStoreState, { message, video }: IHelpMessageComponentLocalProps) {
	return {
		message,
		video,
		show: meta.showHelp
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IHelpMessageComponentProps> {
	return {
		hide: pref => dispatch(actions.setHelpPref(pref))
	};
}

export default connect<IHelpMessageComponentProps>(mapStateToProps, mapDispatchToProps)(HelpMessageComponent);
