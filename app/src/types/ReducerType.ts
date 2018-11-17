import { Action, ActionCreator } from 'redux-typescript-actions';
import { IStoreState } from './index';

export type ReducerHandler<S, A> = (state: S, action: Action<A>) => S;

export abstract class MicroPadReducer<S> {
	public readonly key: keyof IStoreState;
	public readonly initialState: S;
	private handlers: { [actionType: string]: ReducerHandler<S, any> } = {};

	public reducer(state: S, action: Action<any>): S {
		return !!this.handlers[action.type] ? this.handlers[action.type](state, action) : state;
	}

	protected handle<A>(handler: ReducerHandler<S, A>, ...actions: ActionCreator<A>[]): void {
		actions.forEach(action => this.handlers[action.type] = handler);
	}
}
