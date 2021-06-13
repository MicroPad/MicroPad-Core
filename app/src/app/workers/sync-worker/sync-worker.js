import { getAssetInfoImpl } from './sync-worker-impl';

/** @typedef {typeof import('upad-parse/dist/FlatNotepad')} FlatNotepad*/

/**
 * @param {FlatNotepad} flatNotepad
 * @returns {Promise<{ assets: Object.<string, number> }>}>}>}
 */
export function getAssetInfo(flatNotepad) {
	return getAssetInfoImpl(flatNotepad);
}
