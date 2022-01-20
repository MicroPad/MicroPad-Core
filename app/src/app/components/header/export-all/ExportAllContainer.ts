import { connect } from 'react-redux';
import ExportAllComponent from './ExportAllComponent';
import { actions } from '../../../actions';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';

export const exportAllConnector = connect(
	(state: IStoreState) => ({
		theme: ThemeValues[state.app.theme],
		isExporting: state.isExporting.isLoading
	}),
	dispatch => ({
		exportAll: () => dispatch(actions.exportAll.started()),
		exportToMarkdown: () => dispatch(actions.exportToMarkdown.started())
	})
);

export default exportAllConnector(ExportAllComponent);
