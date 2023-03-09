export function showUnsupportedPage(): void {
	document.getElementById('app')!.style.display = 'none';
	document.getElementById('unsupported-page')!.style.display = 'block';
	window.loadingScreen.finish();
}
