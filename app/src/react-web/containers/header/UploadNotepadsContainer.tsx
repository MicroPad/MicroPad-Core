import { connect } from 'react-redux';
import UploadNotepadsComponent, { IUploadNotepadsComponentProps } from '../../components/header/UploadNotepadsComponent/UploadNotepadsComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../../actions';

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		parseNpx: (xml: string) => dispatch(actions.queueParseNpx(xml)),
		parseEnex: (enex: string) => dispatch(actions.parseEnex(enex))
	};
}

export default connect<IUploadNotepadsComponentProps>(null, mapDispatchToProps)(UploadNotepadsComponent);
