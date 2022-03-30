import { connect } from 'react-redux';
import { IStoreState } from '../../../types';
import InfoBannerComponent from './InfoBannerComponent';
import { actions } from '../../../actions';

export const infoBannerContainer = connect(
	({ appInfo }: IStoreState) => ({
		visible: !appInfo.dismissed,
		message: appInfo.message
	}),
	dispatch => ({
		dismiss: () => dispatch(actions.dismissInfoBanner())
	})
);

export default infoBannerContainer(InfoBannerComponent);
