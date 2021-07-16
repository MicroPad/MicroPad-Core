import { Action, ActionCreator } from 'redux-typescript-actions';
import { IStoreState } from './index';
import { MicroPadAction } from '../actions';

export type ReducerHandler<S, ActionPayload> = (state: S, action: Action<ActionPayload>) => S;

export abstract class MicroPadReducer<S> {
	public abstract readonly key: keyof IStoreState;
	public abstract readonly initialState: S;
	private handlers: { [actionType: string]: ReducerHandler<S, any> } = {};
	private memo: Map<number, string> = new Map<number, string>();
	private memoId: number = 0;

	public reducer(state: S, action: MicroPadAction): S {
		return !!this.handlers[action.type] ? this.handlers[action.type](state, action) : state;
	}

	protected handle<ActionPayload>(handler: ReducerHandler<S, ActionPayload>, ...actions: ActionCreator<ActionPayload>[]): void {
		actions.forEach(action => this.handlers[action.type] = handler);
	}

	protected handleMemo<ActionPayload>(handler: ReducerHandler<S, ActionPayload>, ...actions: ActionCreator<ActionPayload>[]): void {
		const key = this.memoId++;
		const memoisedHandler: ReducerHandler<S, ActionPayload> = (state, action) => {
			const newState = handler(state, action);
			if (!this.memo.has(key)) {
				this.memo.set(key, JSON.stringify(newState));
				return newState;
			}

			const memoisedState = this.memo.get(key);
			const newStateJson = JSON.stringify(newState);
			if (memoisedState !== newStateJson) {
				this.memo.set(key, newStateJson)
				return newState;
			}

			return JSON.parse(memoisedState);
		};

		actions.forEach(action => this.handlers[action.type] = memoisedHandler);
	}
}
