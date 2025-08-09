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
		background: '#ffffff',
		accent: '#e7a500',
		chrome: '#607d8b',
		text: '#000000',
		links: '#039be5',
		explorerContent: '#ffffff',
		accentContent: '#ffffff',
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
		accentContent: '#eee8d5',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Gruvbox: {
		background: '#282828',
		accent: '#928374',
		chrome: '#3c3836',
		text: '#ebdbb2',
		links: '#ebdbb2',
		linkUnderline: true,
		explorerContent: '#ebdbb2',
		accentContent: '#ebdbb2',
		backgroundImage: filledBackground,
		drawingBackground: '#28282830',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Midnight: {
		background: '#212121',
		accent: '#424242',
		chrome: '#303030',
		text: '#dddddd',
		links: '#039be5',
		explorerContent: '#dddddd',
		accentContent: '#dddddd',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Void: {
		background: '#000000',
		accent: '#424242',
		chrome: '#212121',
		text: '#dddddd',
		links: '#039be5',
		explorerContent: '#dddddd',
		accentContent: '#dddddd',
		backgroundImage: filledBackground,
		drawingBackground: '#ffffff30',
		instructionImages: {
			notepad: instructionImageDark,
			note: noteInstructionsDark,
			element: elementInstructionsDark
		}
	},
	Peach: {
		background: '#fdd1a4',
		accent: '#fde7a4',
		chrome: '#fdc3a4',
		text: '#000000',
		links: '#444444',
		explorerContent: '#333333',
		accentContent: '#333333',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	Pastel: {
		background: '#f7f2e7',
		accent: '#d8d3cd',
		chrome: '#e0ece4',
		text: '#000000',
		links: '#444444',
		explorerContent: '#333333',
		accentContent: '#333333',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	Wellington: {
		background: '#F4FFF8',
		accent: '#5fa7a0',
		chrome: '#a7ded8',
		text: '#000000',
		links: '#444444',
		explorerContent: '#333333',
		accentContent: '#333333',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	Purple: {
		background: '#ffffff',
		accent: '#ffcc00',
		chrome: '#3d0066',
		text: '#000000',
		links: '#039be5',
		explorerContent: '#ffffff',
		accentContent: '#666666',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	},
	IanPad: {
		background: '#B9F6CA',
		accent: '#fdff19',
		chrome: '#40af3a',
		text: '#000000',
		links: '#039be5',
		explorerContent: '#ffffff',
		accentContent: '#666666',
		backgroundImage: filledBackground,
		instructionImages: {
			notepad: instructionImageLight,
			note: noteInstructionsLight,
			element: elementInstructionsLight
		}
	}
};
