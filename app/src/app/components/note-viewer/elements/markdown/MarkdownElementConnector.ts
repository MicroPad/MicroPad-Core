import { connect } from 'react-redux';
import MarkdownElementComponent from './MarkdownElementComponent';
import { IStoreState } from '../../../../types';
import { actions } from '../../../../actions';

export const markdownElementConnector = connect(
	(state: IStoreState) => ({
		shouldSpellCheck: state.editor.shouldSpellCheck,
		shouldWordWrap: state.editor.shouldWordWrap
	}),
	dispatch => ({
		toggleSpellCheck: () => dispatch(actions.toggleSpellCheck()),
		toggleWordWrap: () => dispatch(actions.toggleWordWrap()),
		openModal: (modal: string) => dispatch(actions.openModal(modal))
	})
);

export default markdownElementConnector(MarkdownElementComponent);
