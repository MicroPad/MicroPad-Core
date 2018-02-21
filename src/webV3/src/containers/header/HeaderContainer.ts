import { Action } from 'redux';
import { connect, Dispatch } from 'react-redux';
import { actions } from '../../actions';
import HeaderComponent, { IHeaderComponentProps } from '../../components/header/HeaderComponent';

export function mapDispatchToProps(dispatch: Dispatch<Action>): IHeaderComponentProps {
	return {
		getHelp: () => dispatch(actions.getHelp.started(0))
	};
}

export default connect<IHeaderComponentProps>(null, mapDispatchToProps)(HeaderComponent);
