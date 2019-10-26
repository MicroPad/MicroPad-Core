// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import { createEpicMiddleware } from 'redux-observable';
import { getStorage } from '..';
import { Dialog } from '../dialogs';

export type EpicDeps = {
	helpNpx: string,
	getStorage: () => { [name: string]: LocalForage },
	Dialog: Dialog
};

export const epicMiddleware = createEpicMiddleware({
	dependencies: {
		helpNpx,
		getStorage,
		Dialog
	} as EpicDeps
});
