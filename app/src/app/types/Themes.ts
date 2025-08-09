export type ThemeName = 'Classic' | 'Solarized' | 'Gruvbox' | 'Midnight' | 'Void' | 'Peach' | 'Pastel' | 'Wellington' | 'Purple' | 'IanPad';

export interface ITheme {
	background: string;
	chrome: string;
	accent: string;
	text: string;
	links: string;
	/** Should links be underlined? Defaults to 'no'. */
	linkUnderline?: boolean;
	explorerContent: string;
	accentContent: string;
	instructionImages: {
		notepad: string;
		note: string;
		element: string;
	};
	backgroundImage?: string;
	drawingBackground?: string;
}
