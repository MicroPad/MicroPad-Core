import { getAssetInfoImpl } from './sync-worker-impl';

onmessage = async message => {
	switch (message.data?.type) {
		case 'getAssetInfo':
			getAssetInfo(message.data.flatNotepad)
				.then(data => respond(message.data.cid, data))
				.catch(error => respond(message.data.cid, { error }))
			break;
		default:
			throw new Error(`Unknown message: ${JSON.stringify(message.data)}`);
	}
};

function getAssetInfo(flatNotepad) {
	return getAssetInfoImpl(flatNotepad);
}

function respond(cid, data) {
	postMessage({ cid, ...data })
}
