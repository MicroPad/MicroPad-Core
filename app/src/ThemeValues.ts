import { ITheme, ThemeName } from './types/Themes';

const classicBackground = require('./assets/background.png');
const filledBackground = require('./assets/dark-background.png');

export const ThemeValues: { [K in ThemeName]: ITheme } = {
	Classic: {
		background: '#fff',
		accent: '#ffb300',
		chrome: '#607d8b',
		text: '#000',
		links: '#039be5',
		explorerContent: '#fff',
		backgroundImage: classicBackground
	},
	Solarized: {
		background: '#002b36',
		accent: '#b58900',
		chrome: '#073642',
		text: '#839496',
		links: '#eee8d5',
		explorerContent: '#eee8d5',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30'
	},
	IanPad: {
		background: '#B9F6CA',
		accent: '#fdff19',
		chrome: '#40af3a',
		text: '#000',
		links: '#039be5',
		explorerContent: '#fff',
		backgroundImage: filledBackground
	},
	Midnight: {
		background: '#212121',
		accent: '#424242',
		chrome: '#303030',
		text: '#ddd',
		links: '#039be5',
		explorerContent: '#ddd',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30'
	}
};
