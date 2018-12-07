import { IStoreState } from '../types';
import AppBodyComponent, { IAppBodyComponentProps } from '../components/AppBodyComponent';
import { connect } from 'react-redux';

export function mapStateToProps({ app }: IStoreState): IAppBodyComponentProps {
	return {
		isFullScreen: app.isFullScreen
	};
}

export default connect<IAppBodyComponentProps>(mapStateToProps)(AppBodyComponent);
