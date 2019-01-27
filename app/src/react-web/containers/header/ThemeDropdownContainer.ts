import { IStoreState } from '../../../core/types';
import {
	default as ThemeDropdownComponent,
	IThemeDropdownComponentProps
} from '../../components/header/ThemeDropdownComponent';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';

export function mapStateToProps({ app }: IStoreState) {
	return {
		selectedTheme: app.theme
	} as IThemeDropdownComponentProps;
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IThemeDropdownComponentProps> {
	return {
		select: theme => dispatch(actions.selectTheme(theme))
	};
}

export default connect<IThemeDropdownComponentProps>(mapStateToProps, mapDispatchToProps)(ThemeDropdownComponent);
