export interface IMetaStoreState {
	version: IVersion;
	isFullScreen: boolean;
	defaultFontSize: string;
	zoom: number;
}

export interface IVersion {
	major: number;
	minor: number;
	patch: number;
	status: 'dev' | 'alpha' | 'beta' | 'stable';
}
