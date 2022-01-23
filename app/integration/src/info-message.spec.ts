import { Page } from 'playwright';
import { openMicroPadRaw } from './utils/general-ui';

describe(`App Info Messages`, () => {
	it(`should not show the info banner if there is no informational message available`, async () => {
		// Arrange
		const page = await browser.newContext().then(ctx => ctx.newPage());
		await page.route(/info\.json\?.*$/, route => {
			route.fulfill({
				status: 404,
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});

		// Act
		await openMicroPad(page);
		await page.waitForResponse(/info\.json\?.*$/, { timeout: 6000 });

		// Assert
		expect(await page.$('.info-banner')).toBeNull();
	});

	it(`should not show the info banner if there is a malformed message`, async () => {
		// Arrange
		const page = await browser.newContext().then(ctx => ctx.newPage());
		await page.route(/info\.json\?.*$/, route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: {
					'access-control-allow-origin': '*'
				},
				body: `this isn't valid JSON`
			});
		});

		// Act
		await openMicroPad(page);
		await page.waitForResponse(/info\.json\?.*$/, { timeout: 6000 });

		// Assert
		expect(await page.$('.info-banner')).toBeNull();
	});

	it(`should show the info banner if there is a message`, async () => {
		// Arrange
		const expected = 'Hello test software! beep boop';

		const page = await browser.newContext().then(ctx => ctx.newPage());
		await page.route(/info\.json\?.*$/, route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: {
					'access-control-allow-origin': '*'
				},
				body: JSON.stringify({ text: expected })
			});
		});

		// Act
		await openMicroPad(page);
		await page.waitForResponse(/info\.json\?.*$/, { timeout: 6000 });
		const infoBanner = await page.$('.info-banner__msg');

		// Assert
		expect(await infoBanner?.innerText()).toBe(expected);
	});

	it(`should show the info banner with link if there is a message with a call-to-action`, async () => {
		// Arrange
		const expected = 'Hello test software! beep boop';
		const expectedCta = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		const page = await browser.newContext().then(ctx => ctx.newPage());
		await page.route(/info\.json\?.*$/, route => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: {
					'access-control-allow-origin': '*'
				},
				body: JSON.stringify({
					text: expected,
					cta: expectedCta
				})
			});
		});

		// Act
		await openMicroPad(page);
		await page.waitForResponse(/info\.json\?.*$/, { timeout: 6000 });
		const infoBanner = await page.$('.info-banner__msg');

		// Assert
		expect(await infoBanner?.innerHTML()).toMatchSnapshot();
	});
});

async function openMicroPad(page: Page) {
	await openMicroPadRaw(page);
	await page.waitForSelector('.brand-logo');
}
