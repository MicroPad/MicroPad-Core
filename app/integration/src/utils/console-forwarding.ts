import { Page } from 'playwright';

export function forwardConsole(_page: Page = page) {
	_page.on('console', msg => {
		if (msg.type() === 'error') {
			console.warn('forwarded', msg.text());
		}
	});
}
