import { connect, Dispatch } from 'react-redux';
import UploadNotepadsComponent, { IUploadNotepadsComponentProps } from '../../components/header/UploadNotepadsComponent/UploadNotepadsComponent';
import { Action } from 'redux';
import { actions } from '../../actions';

export function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		parseNpx: (xml: string) => dispatch(actions.parseNpx.started(xml))
	};
}

export default connect<IUploadNotepadsComponentProps>(null, mapDispatchToProps)(UploadNotepadsComponent);
