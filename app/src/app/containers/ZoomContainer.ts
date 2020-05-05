import { connect } from 'react-redux';
import ZoomComponent from '../components/note-viewer/ZoomComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { IStoreState } from '../types';
import { ThemeValues } from '../ThemeValues';

function mapStateToProps({ app }: IStoreState) {
	return {
		theme: ThemeValues[app.theme]
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		update: newZoom => dispatch(actions.updateZoomLevel(newZoom))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ZoomComponent);
