module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			browsers: ['chromium', 'firefox'],
			launchOptions: {
				headless: true
			},
		}
	},
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},
	globals: {
		'ts-jest': {
			tsconfig: 'integration/tsconfig.json'
		}
	},
	'roots': ['<rootDir>/src/', '<rootDir>/integration/src/'],
	setupFilesAfterEnv: ['<rootDir>/integration/src/utils/jest-image.ts']
};
