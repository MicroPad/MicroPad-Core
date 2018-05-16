import { connect, Dispatch } from 'react-redux';
import ZoomComponent, { IZoomComponentProps } from '../components/note-viewer/ZoomComponent';
import { Action } from 'redux';
import { actions } from '../actions';

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return <Partial<IZoomComponentProps>> {
		update: newZoom => dispatch(actions.updateZoomLevel(newZoom))
	};
}

export default connect(null, mapDispatchToProps)(ZoomComponent);
