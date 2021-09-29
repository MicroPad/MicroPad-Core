import { connect } from 'react-redux';
import { actions } from '../../../actions';
import ImportMarkdownComponent from './ImportMarkdownComponent';

export const importMarkdownConnector = connect(null, dispatch => ({
	importMd: md => dispatch(actions.importMarkdown(md))
}));

export default importMarkdownConnector(ImportMarkdownComponent);
