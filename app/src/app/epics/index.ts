// @ts-expect-error
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '../assets/Help.npx';

import { createEpicMiddleware, StateObservable } from 'redux-observable';
import { getStorage, StorageMap, TOAST_HANDLER } from '../root';
import { IStoreState } from '../types';
import ToastEventHandler from '../services/ToastEventHandler';
import { NotificationService } from '../services/NotificationService';
import { MicroPadAction } from '../actions';

export type EpicDeps = {
	helpNpx: string,
	getStorage: () => StorageMap,
	now: () => Date,
	getToastEventHandler: () => ToastEventHandler,
	notificationService: NotificationService
};

export const epicMiddleware = createEpicMiddleware<MicroPadAction, MicroPadAction, IStoreState, EpicDeps>({
	dependencies: {
		helpNpx,
		getStorage: getStorage,
		now: () => new Date(),
		getToastEventHandler: () => TOAST_HANDLER,
		notificationService: new NotificationService()
	}
});

export type EpicStore = StateObservable<IStoreState>;
