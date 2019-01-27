import { connect } from 'react-redux';
import ZoomComponent, { IZoomComponentProps } from '../components/note-viewer/ZoomComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { IStoreState } from '../../core/types';
import { ThemeValues } from '../ThemeValues';

function mapStateToProps({ app }: IStoreState) {
	return {
		theme: ThemeValues[app.theme]
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return <Partial<IZoomComponentProps>> {
		update: newZoom => dispatch(actions.updateZoomLevel(newZoom))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ZoomComponent);
