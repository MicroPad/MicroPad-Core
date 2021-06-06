module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			browsers: ['chromium', 'firefox'],
			launchOptions: {
				headless: false
			}
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
	'roots': ['<rootDir>/src/', '<rootDir>/integration/src/']
};
