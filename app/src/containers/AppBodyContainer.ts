import { IStoreState } from '../types';
import AppBodyComponent, { IAppBodyComponentProps } from '../components/AppBodyComponent';
import { connect } from 'react-redux';

export function mapStateToProps({ meta }: IStoreState): IAppBodyComponentProps {
	return {
		isFullScreen: meta.isFullScreen
	};
}

export default connect<IAppBodyComponentProps>(mapStateToProps)(AppBodyComponent);
