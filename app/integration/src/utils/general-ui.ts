/**
 * Get MicroPad loaded and happy just sitting in the initial state we want for most tests.
 */
export async function stabiliseMicroPad() {
	await openMicroPad()
		.then(dismissWhatsNew);
}

export async function openMicroPad() {
	await page.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000');
	await page.waitForSelector('.brand-logo');
}

export async function dismissWhatsNew() {
	const helpModal = await page.$('//*[@id="markdown-help"]/../..');
	await helpModal?.$('.modal-footer > button').then(closeButton => closeButton?.click());
}
