import { initSentry } from '../sentry';
import { SUPPORT_REGEX } from './regex';

initSentry();

const shouldSkip = document.cookie.split('; ').some(cookie => cookie == `ignoreSupport=1`);

// This sucks but is needed because feature detection can't handle syntax errors like top-level await.
// There's a feature detection based page in `root.tsx` that should be used in most cases instead.
const isSupported = shouldSkip || SUPPORT_REGEX.test(navigator.userAgent);

window.isSupported = isSupported;

if (!isSupported) {
	window.addEventListener('load', () => {
		document.getElementById('unsupported-page')!.style.display = 'block';
	});
}
