import { ThemeName } from './Themes';

export interface IMetaStoreState {
	version: IVersion;
	isFullScreen: boolean;
	defaultFontSize: string;
	zoom: number;
	showHelp: boolean;
	theme: ThemeName;
}

export interface IVersion {
	major: number;
	minor: number;
	patch: number;
	status: 'dev' | 'alpha' | 'beta' | 'stable';
}
