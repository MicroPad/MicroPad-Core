import { ITheme, ThemeName } from './types/Themes';

import classicBackground from './assets/background.png';
import filledBackground from './assets/dark-background.png';
import instructionImageLight from './assets/click-to-make.png';
import instructionImageDark from './assets/click-to-make-dark.png';
import noteInstructionsLight from './assets/click-to-make-open.png';
import noteInstructionsDark from './assets/click-to-make-open-dark.png';
import elementInstructionsLight from './assets/click-to-insert.png';
import elementInstructionsDark from './assets/click-to-insert-dark.png';

export const ThemeValues: { [K in ThemeName]: ITheme } = {
	Classic: {
		background: '#fff',
		accent: '#ffb300',
		chrome: '#607d8b',
		text: '#000',
		links: '#039be5',
		explorerContent: '#fff',
		backgroundImage: classicBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	Solarized: {
		background: '#002b36',
		accent: '#b58900',
		chrome: '#073642',
		text: '#839496',
		links: '#eee8d5',
		explorerContent: '#eee8d5',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	IanPad: {
		background: '#B9F6CA',
		accent: '#fdff19',
		chrome: '#40af3a',
		text: '#000',
		links: '#039be5',
		explorerContent: '#fff',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	Midnight: {
		background: '#212121',
		accent: '#424242',
		chrome: '#303030',
		text: '#ddd',
		links: '#039be5',
		explorerContent: '#ddd',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Void: {
		background: '#000',
		accent: '#424242',
		chrome: '#212121',
		text: '#ddd',
		links: '#039be5',
		explorerContent: '#ddd',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Purple: {
		background: '#fff',
		accent: '#ffcc00',
		chrome: '#3d0066',
		text: '#000',
		links: '#039be5',
		explorerContent: '#fff',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	}
};
