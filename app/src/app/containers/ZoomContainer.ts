import { connect } from 'react-redux';
import ZoomComponent, { IZoomComponentProps } from '../components/note-viewer/ZoomComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { IStoreState } from '../types';
import { ThemeValues } from '../ThemeValues';

function mapStateToProps({ app }: IStoreState): IZoomComponentProps {
	return {
		theme: ThemeValues[app.theme],
		isFullScreen: app.isFullScreen
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		update: newZoom => dispatch(actions.updateZoomLevel(newZoom))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ZoomComponent);
