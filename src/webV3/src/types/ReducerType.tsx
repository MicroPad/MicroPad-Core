import { Reducer } from 'redux';

export interface IReducer {
	key: string;
	readonly initialState: object;
	reducer: Reducer<object>;
}
