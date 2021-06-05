import { Action, ActionCreator } from 'redux-typescript-actions';
import { IStoreState } from './index';
import { MicroPadAction } from '../actions';

export type ReducerHandler<S, ActionPayload> = (state: S, action: Action<ActionPayload>) => S;

export abstract class MicroPadReducer<S> {
	public abstract readonly key: keyof IStoreState;
	public abstract readonly initialState: S;
	private handlers: { [actionType: string]: ReducerHandler<S, any> } = {};

	public reducer(state: S, action: MicroPadAction): S {
		return !!this.handlers[action.type] ? this.handlers[action.type](state, action) : state;
	}

	protected handle<ActionPayload>(handler: ReducerHandler<S, ActionPayload>, ...actions: ActionCreator<ActionPayload>[]): void {
		actions.forEach(action => this.handlers[action.type] = handler);
	}
}
