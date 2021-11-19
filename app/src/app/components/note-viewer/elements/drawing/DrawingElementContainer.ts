import { connect } from 'react-redux';
import { IStoreState } from '../../../../types';
import DrawingElementComponent from './DrawingElementComponent';
import { DrawMode } from '../../../../reducers/EditorReducer';
import { actions } from '../../../../actions';

export const drawingElementConnector = connect(
	(state: IStoreState) => ({
		isFullScreen: state.app.isFullScreen,
		drawMode: state.editor.drawMode
	}),
	dispatch => ({
		setDrawMode: (mode: DrawMode) => dispatch(actions.setDrawMode(mode))
	})
);

export default drawingElementConnector(DrawingElementComponent);
