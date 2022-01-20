import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';

export type AppInfoState = {
	message?: AppInfoMessage,
	dismissed: boolean
};

export type AppInfoMessage = {
	text: string,
	cta?: string
};

export class AppInfoReducer extends AbstractReducer<AppInfoState> {
	public readonly key = 'appInfo';
	public readonly initialState: AppInfoState = {
		dismissed: false
	};

	constructor() {
		super();

		this.handle(state => ({
			...state,
			dismissed: true
		}), actions.dismissInfoBanner);

		this.handle((state, action) => ({
			...state,
			dismissed: state.message?.text === action.payload.text ? state.dismissed : false, // only re-show if new message
			message: action.payload
		}), actions.setInfoMessage);
	}
}
