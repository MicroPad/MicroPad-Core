/**
 * Get MicroPad loaded and happy just sitting in the initial state we want for most tests.
 */
import { Page } from 'playwright';

export async function stabiliseMicroPad() {
	await page.route(/info\.json\?.*$/, route => {
		route.fulfill({
			status: 404,
			headers: { 'access-control-allow-origin': '*' }
		});
	});

	await openMicroPad()
		.then(dismissWhatsNew);
}

export async function openMicroPad() {
	await openMicroPadRaw();
	await page.waitForSelector('.brand-logo');
}

export async function openMicroPadRaw(myPage: Page = page) {
	await myPage.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000?prod=1&integration=1');
}

export async function dismissWhatsNew() {
	const helpModal = await getCurrentModal();
	await helpModal.$('.modal-footer > button').then(closeButton => closeButton?.click());
}

export async function getCurrentModal() {
	return await page.waitForSelector(`.modal.open`);
}
