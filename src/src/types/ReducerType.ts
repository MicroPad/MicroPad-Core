import { Reducer } from 'redux';

export interface IReducer<T> {
	readonly key: string;
	readonly initialState: T;
	reducer: Reducer<T>;
}
