import { Action, ActionCreator } from 'redux-typescript-actions';

export type ReducerHandler<S, A> = (state: S, action: Action<A>) => S;

export abstract class MicroPadReducer<S> {
	public readonly key: string;
	public readonly initialState: S;
	private handlers: { [actionType: string]: ReducerHandler<S, any> } = {};

	public reducer(state: S, action: Action<any>): S {
		return !!this.handlers[action.type] ? this.handlers[action.type](state, action) : state;
	}

	protected handle<A>(action: ActionCreator<A>, handler: ReducerHandler<S, A>): void {
		this.handlers[action.type] = handler;
	}
}
