/**
 * This class handles the old sync code. This code is all bad
 * and is simply here to carry over until a better server-side situation can be sorted out.
 */
import { IStoreState } from '../types';
import { Store } from 'redux';
import { IAssets, INotepad, INotepadStoreState } from '../types/NotepadTypes';
import { getAssets } from '../epics/NotepadEpics';
import { actions } from '../actions';

interface IPutRequest {
	req: string;
	syncURL: string;
	token: string;
	url: string;
	data: string;
	md5?: number;
	method: string;
}

interface IDownlodData {
	req: string;
	localMap: object;
	remoteMap: object;
	chunks: Uint8Array[];
	filename: string;
}

export class OldSyncHandler {
	private downloadData: IDownlodData;
	private putRequests: IPutRequest[];
	private syncWorker: Worker;
	private uploadWorker: Worker;
	private store: Store<IStoreState>;
	private token: string;

	constructor(store: Store<IStoreState>) {
		this.store = store;
		this.putRequests = [];
		this.syncWorker = new Worker('/assets/old-sync/syncWorker.min.js');
		this.uploadWorker = new Worker('/assets/old-sync/uploadWorker.min.js');

		const tsWindow = <any> window;
		tsWindow.ms = {
			sync: this.sync,
			download: this.download
		};

		this.listen();
	}

	public sync = (token?: string) => {
		if (token) this.token = token;
		if (!this.token) {
			console.log('You need to give me a token');
			return;
		}

		const notepad = this.getNotepad();
		if (!notepad) {
			console.log('No notepad loaded!');
			return;
		}

		console.log(`Syncing ${notepad.title}...`);

		getAssets(notepad.notepadAssets)
			.then((assets: IAssets) => {
				this.syncWorker.postMessage({
					req: 'sync',
					syncURL: 'https://getmicropad.com/sync/api/',
					token: this.token,
					filename: `${notepad.title.replace(/[^a-z0-9 ]/gi, '')}.npx`,
					notepad: notepad,
					assets,
					method: 'block'
				});
			});
	}

	public download = () => {
		if (!this.downloadData || !this.token) return;

		this.syncWorker.postMessage({
			req: 'download',
			syncURL: 'https://getmicropad.com/sync/api/',
			token: this.token,
			localMap: this.downloadData.localMap,
			remoteMap: this.downloadData.remoteMap,
			chunks: this.downloadData.chunks,
			filename: this.downloadData.filename
		});
	}

	private listen = () => {
		this.uploadWorker.onmessage = event => {
			const msg = event.data;

			switch (msg.req) {
				case 'done':
					this.putRequests.shift();
					this.cueUpload();
					break;

				default:
					break;
			}
		};

		this.syncWorker.onmessage = event => {
			const msg = event.data;

			switch (msg.req) {
				case 'askDownload':
					console.log(`Run download() on me pls`);
					this.downloadData = msg;
					break;

				case 'download':
					console.log('Parsing the NPX goodness now');
					this.store.dispatch(actions.parseNpx.started(msg.text));
					break;

				case 'upload':
					console.log('Upload done');
					break;

				case 'error':
					console.log(msg);
					break;

				case 'cueGET':
				case 'cuePUT':
					setTimeout(() => {
						this.putRequests.push(msg);

						if (this.putRequests.length === 1) {
							this.cueUpload();
						}
					}, 0);
					break;

				default:
					break;
			}
		};
	}

	private cueUpload = () => {
		if (this.putRequests.length > 0) this.uploadWorker.postMessage(this.putRequests[0]);
		console.log(`Uploading... (${this.putRequests.length} parts remaining)`);
	}

	private getNotepad = (): INotepad | undefined => {
		return (this.store.getState().notepads.notepad || <INotepadStoreState> {}).item;
	}
}
