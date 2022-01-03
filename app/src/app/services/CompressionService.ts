import { FlatNotepad } from 'upad-parse';
import { generateGuid } from '../util';
import { fromEvent } from 'rxjs';
import { WorkerMsgData } from '../workers';
import { filter, map, take } from 'rxjs/operators';
import type { _optimiseAssets } from '../workers/sync-worker/optimise-assets';

const AssetOptimiserWorker = new Worker(build.defs.SYNC_WORKER_PATH, { type: 'module' });

export async function runOptimiseAssets(assetList: string[], notepad: FlatNotepad): Promise<Array<Blob | null>> {
	const cid = generateGuid();
	const res$ = fromEvent<MessageEvent<WorkerMsgData<ReturnType<typeof _optimiseAssets>>>>(AssetOptimiserWorker, 'message').pipe(
		filter(event => event.data?.cid === cid),
		map(event => {
			if (event.data.error) throw event.data.error;
			return event.data;
		}),
		take(1)
	);

	AssetOptimiserWorker.postMessage({
		cid,
		type: 'optimiseAssets',
		flatNotepad: notepad,
		assetList
	});

	return res$.toPromise();
}
