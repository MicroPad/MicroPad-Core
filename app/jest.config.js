module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			browsers: ['chromium'],
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
	setupFilesAfterEnv: ['<rootDir>/integration/src/utils/jest-image.ts'],
	testTimeout: 60000,
	reporters: [
		'default',
		['jest-junit', {
			outputDirectory: '.reports',
			outputName: 'junit.xml'
		}]
	]
};
