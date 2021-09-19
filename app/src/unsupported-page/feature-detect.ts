export async function hasRequiredFeatures(): Promise<boolean> {
	if (shouldIgnoreCompatibility()) {
		return true;
	}

	return doesSupportSrcDoc() && hasUrlHelperClasses();
}

export function shouldIgnoreCompatibility(): boolean {
	return document.cookie.split('; ').some(cookie => cookie === `ignoreSupport=1`);
}

function doesSupportSrcDoc(): boolean {
	const testIframe = document.createElement('iframe');
	testIframe.srcdoc = 'test';
	return testIframe.getAttribute('srcdoc') === 'test';
}

function hasUrlHelperClasses(): boolean {
	try {
		const url = new URL('https://example.com');
		return !!new URLSearchParams(url.search);
	} catch (_) { return false; }
}
