import { filter } from 'rxjs/operators';
import { SyntheticEvent } from 'react';
import { FlatNotepad } from 'upad-parse/dist';
import { ModalOptions } from 'react-materialize';

export const DEFAULT_MODAL_OPTIONS: ModalOptions = {
	onOpenEnd: (modal: HTMLElement) => {
		window.MicroPadGlobals.currentModalId = modal.id;
	},
	onCloseEnd: () => {
		delete window.MicroPadGlobals.currentModalId;
	}
};

export const filterTruthy = <T>() => filter((a: T | undefined | null | false): a is T => !!a);

export const noEmit = () => filter((_a): _a is never => false);

export function isDev(includeNextDev: boolean = true): boolean {
	/* eslint-disable no-restricted-globals */
	const params = new URLSearchParams(location.search);
	return (
		!params.get('prod')
		&& (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || (includeNextDev && location.hostname === 'next.getmicropad.com'))
	);
	/* eslint-enable no-restricted-globals */
}

export function isMobile(): boolean {
	return window.screen.width < 600;
}

export function readFileInputEventAsText(event: SyntheticEvent<HTMLInputElement>): Promise<string> {
	return new Promise(resolve => {
		const file = event.currentTarget.files![0];
		const reader = new FileReader();

		reader.onload = () => resolve(reader.result as string);

		reader.readAsText(file);
	});
}

export function fixFileName(filename: string) {
	return filename.replace(/[<>:;,?"*|/\\]+/g, '_');
}

// Thanks to https://stackoverflow.com/a/105074
export function generateGuid(): string {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function getAsBase64(blob: Blob): Promise<string> {
	return new Promise<string>(resolve => {
		try {
			const reader = new FileReader();
			reader.onload = event => resolve((event.target as any).result);
			reader.readAsDataURL(blob);
		} catch (e) {
			console.warn(e);
			resolve('');
		}
	});
}

export function getBytes(blob: Blob): Promise<ArrayBuffer> {
	return new Promise(resolve => {
		try {
			const reader = new FileReader();
			reader.onload = event => resolve((event.target as any).result);
			reader.readAsArrayBuffer(blob);
		} catch (e) {
			console.warn(e);
			resolve(new Uint8Array());
		}
	});
}

export function getUsedAssets(notepad: FlatNotepad): Set<string> {
	return new Set(
		Object.values(notepad.notes).map(n =>
			n.elements
				.map(e => e.args.ext)
				.filter((a?: string): a is string => !!a)
		)
		.reduce((used, cur) => used.concat(cur), [])
	);
}

export function unreachable() {
	return new Error('Unreachable Error!');
}
