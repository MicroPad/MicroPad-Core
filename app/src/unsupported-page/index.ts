import { initSentry } from '../sentry';
import { showUnsupportedPage } from './show-page';
import { shouldIgnoreCompatibility } from './feature-detect';

initSentry();

const shouldSkip = shouldIgnoreCompatibility();

// This sucks but is needed because feature detection can't handle syntax errors like top-level await.
// There's a feature detection based page in `root.tsx` that should be used in most cases instead.
const isSupported = shouldSkip || new RegExp(build.defs.SUPPORTED_BROWSERS_REGEX).test(navigator.userAgent);

window.isSupported = isSupported;

if (!isSupported) {
	window.addEventListener('load', () => {
		try {
			showUnsupportedPage();
		} catch (err) {
			console.error('error showing unsupported page', err);
		}
	});
}
