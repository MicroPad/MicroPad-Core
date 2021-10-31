import { connect } from 'react-redux';
import MarkdownElementComponent from './MarkdownElementComponent';
import { IStoreState } from '../../../../types';
import { actions } from '../../../../actions';

export const markdownElementContainer = connect(
	(store: IStoreState) => ({
		shouldSpellCheck: store.editor.shouldSpellCheck,
		shouldWordWrap: store.editor.shouldWordWrap
	}),
	dispatch => ({
		toggleSpellCheck: () => dispatch(actions.toggleSpellCheck()),
		toggleWordWrap: () => dispatch(actions.toggleWordWrap()),
		openModal: (modal: string) => dispatch(actions.openModal(modal))
	})
);

export default markdownElementContainer(MarkdownElementComponent);
