import { default as initFend } from 'fend-wasm-web';

export async function initWasm(): Promise<void> {
	await Promise.all([
		initFend()
	]);
}