import { openMicroPad } from './utils/general-ui';

describe(`App Start`, () => {
	beforeAll(async () => {
		await openMicroPad(); // Load MicroPad
	})

	it(`should start MicroPad`, async () => {
		// Arrange / Act
		const headerTitleEl = await page.waitForSelector('.brand-logo');
		const headerTitle = await page.$eval('.brand-logo', e => e.textContent);

		// Assert
		expect(await headerTitleEl.isVisible()).toBe(true);
		expect(headerTitle?.startsWith('µPad')).toBe(true);
	});

	it(`should start MicroPad and display "What's New"`, async () => {
		// Arrange / Act
		let mdHelp = await page.waitForSelector('#markdown-help');

		// Assert
		expect(await mdHelp.isVisible()).toBe(true);
	});
});
