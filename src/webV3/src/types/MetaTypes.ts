export interface IMetaStoreState {
	version: IVersion;
	isFullScreen: boolean;
}

export interface IVersion {
	major: number;
	minor: number;
	patch: number;
	status: 'dev' | 'alpha' | 'beta' | 'stable';
}
