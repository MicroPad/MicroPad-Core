export function isIOS(): boolean {
	return navigator.userAgent.includes('Mac') && 'ontouchend' in document;
}
