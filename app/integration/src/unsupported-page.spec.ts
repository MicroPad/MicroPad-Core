describe(`Unsupported Page`, () => {
	it(`should show the unsupported page on unsupported devices`, async () => {
		// Arrange
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.1; rv:90.0) Gecko/20100101 Firefox/79.0'
		});
		const page = await context.newPage();
		await page.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000?prod=1');

		// Act
		const unsupportedDiv = await page.$('#unsupported-page');

		// Assert
		expect(await unsupportedDiv?.isVisible()).toBe(true);
		expect(await page.$('#app').then(app => app?.innerHTML())).toBe('');
	});

	it(`should be able to continue anyway`, async () => {
		// Arrange
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.1; rv:90.0) Gecko/20100101 Firefox/79.0'
		});
		const page = await context.newPage();
		await page.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000?prod=1');

		// Act + Assert
		await page.$('#unsupported-page button').then(continueBtn => continueBtn!.click());
		await page.waitForSelector('.brand-logo');

		expect(
			await page.$('#app')
				.then(app => app!.innerHTML())
				.then(html => html.length > 0)
		).toBe(true);

		await page.reload();
		await page.waitForSelector('.brand-logo');
		expect(
			await page.$('#app')
				.then(app => app!.innerHTML())
				.then(html => html.length > 0)
		).toBe(true);
	});

	it(`should not show the page on future browsers`, async () => {
		// Arrange
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.1; rv:90.0) Gecko/20100101 Firefox/100.0'
		});
		const page = await context.newPage();
		await page.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000?prod=1');

		// Act
		const unsupportedDiv = await page.$('#unsupported-page');

		// Assert
		expect(await unsupportedDiv?.isVisible()).toBe(false);

		await page.waitForSelector('.brand-logo');
		expect(
			await page.$('#app')
				.then(app => app!.innerHTML())
				.then(html => html.length > 0)
		).toBe(true);
	});
});