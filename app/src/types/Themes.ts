export type ThemeName = 'Classic' | 'Solarized';

export interface ITheme {
	background: string;
	chrome: string;
	accent: string;
	text: string;
	links: string;
	explorerContent: string;
	backgroundImage?: string;
	drawingBackground?: string;
}
