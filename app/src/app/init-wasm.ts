import { default as initFend } from 'fend-wasm-web';
import { default as initPhoton } from '@nick_webster/photon';

export async function initWasm(): Promise<void> {
	await Promise.all([
		initFend(),
		initPhoton()
	]);
}