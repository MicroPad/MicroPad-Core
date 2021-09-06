import { connect } from 'react-redux';
import ZoomComponent from './ZoomComponent';
import { actions } from '../../../actions';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { ZoomChange } from '../../../types/ActionTypes';

export const zoomConnector = connect(
	({ app }: IStoreState) => ({
		theme: ThemeValues[app.theme],
		isFullScreen: app.isFullScreen
	}),
	dispatch => ({
		zoomIn: () => dispatch(actions.updateZoomLevel(ZoomChange.INCREASE)),
		zoomOut: () => dispatch(actions.updateZoomLevel(ZoomChange.DECREASE))
	})
);

export default zoomConnector(ZoomComponent);
