/**
 * Get MicroPad loaded and happy just sitting in the initial state we want for most tests.
 */
export async function stabiliseMicroPad() {
	await openMicroPad()
		.then(dismissWhatsNew);
}

export async function openMicroPad() {
	await page.goto(process.env['MICROPAD_URL'] ?? 'http://localhost:3000?prod=1');
	await page.waitForSelector('.brand-logo');
}

export async function dismissWhatsNew() {
	const helpModal = await getCurrentModal();
	await helpModal.$('.modal-footer > button').then(closeButton => closeButton?.click());
}

export async function getCurrentModal() {
	return await page.waitForSelector(`.modal.open`);
}
