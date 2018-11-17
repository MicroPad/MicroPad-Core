import { IStoreState } from '../types';
import {
	default as HelpMessageComponent,
	IHelpMessageComponentLocalProps,
	IHelpMessageComponentProps
} from '../components/HelpMessageComponent';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { ThemeValues } from '../ThemeValues';

export function mapStateToProps({ meta }: IStoreState, { message, video }: IHelpMessageComponentLocalProps) {
	return {
		message,
		video,
		show: meta.showHelp,
		theme: ThemeValues[meta.theme]
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IHelpMessageComponentProps> {
	return {
		hide: pref => dispatch(actions.setHelpPref(pref))
	};
}

export default connect<IHelpMessageComponentProps>(mapStateToProps, mapDispatchToProps)(HelpMessageComponent);
