import * as Materialize from 'materialize-css/dist/js/materialize';
import { generateGuid } from '../util';

type ToastHandler = () => void;

export default class ToastEventHandler {
	private readonly handlers: { [action: string]: ToastHandler } = {};

	constructor() {
		window['toastEvent'] = (guid: string) => {
			Materialize.Toast.removeAll();

			const handler = this.handlers[guid];
			delete this.handlers[guid];

			if (!!handler) handler();
		};
	}

	public register(handler: ToastHandler): string {
		const guid = generateGuid();
		this.handlers[guid] = handler;

		// Let the collector get GC'd after 5 minutes if it hasn't been called
		setTimeout(() => { delete this.handlers[guid]; }, 5 * 60 * 1000)

		return guid;
	}
}
