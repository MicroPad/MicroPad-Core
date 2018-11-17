import { Action } from 'redux';

export abstract class MicroPadReducer<T> {
	public readonly key: string;
	public readonly initialState: T;
	public abstract reducer(state: T, action: Action): T;
}
