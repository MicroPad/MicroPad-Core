import { connect } from 'react-redux';
import ZoomComponent, { IZoomComponentProps } from '../components/note-viewer/ZoomComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { IStoreState } from '../types';
import { ThemeValues } from '../ThemeValues';
import { ZoomChange } from '../types/ActionTypes';

function mapStateToProps({ app }: IStoreState): IZoomComponentProps {
	return {
		theme: ThemeValues[app.theme],
		isFullScreen: app.isFullScreen
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IZoomComponentProps> {
	return {
		zoomIn: () => dispatch(actions.updateZoomLevel(ZoomChange.INCREASE)),
		zoomOut: () => dispatch(actions.updateZoomLevel(ZoomChange.DECREASE))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ZoomComponent);
