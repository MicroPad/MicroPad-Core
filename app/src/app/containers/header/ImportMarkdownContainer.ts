import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';
import ImportMarkdownComponent, { IImportMarkdownComponentProps } from '../../components/header/ImportMarkdownComponent';

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IImportMarkdownComponentProps> {
	return {
		importMd: md => dispatch(actions.importMarkdown(md))
	};
}

export default connect(null, mapDispatchToProps)(ImportMarkdownComponent);
