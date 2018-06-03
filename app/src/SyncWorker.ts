import * as localforage from 'localforage';

export async function test() {
	const ASSET_STORAGE = localforage.createInstance({
		name: 'MicroPad',
		storeName: 'assets'
	});

	await ASSET_STORAGE.ready();
	return await ASSET_STORAGE.keys();
}
