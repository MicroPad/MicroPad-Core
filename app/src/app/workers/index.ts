export type WorkerMsgData<T> = {
	cid: string,
	type?: string,
	error?: Error
} & T;
