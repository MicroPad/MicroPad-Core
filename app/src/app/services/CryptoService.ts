import { NotepadShell } from 'upad-parse/dist/interfaces';
import { Notepad, Translators } from 'upad-parse/dist';
import { Dialog, RememberMePromptRes } from './dialogs';
import { decrypt } from 'upad-parse/dist/crypto';
import { AddCryptoPasskeyAction, EncryptNotepadAction } from '../types/ActionTypes';
import { Action } from 'typescript-fsa';
import { actions } from '../actions';
import { MicroPadStore } from '../root';

export class DecryptionError extends Error {
	constructor (error: Error) {
		super(error.message);
		this.name = error.name;
		this.stack = error.stack;
	}
}

export async function fromShell(shell: NotepadShell, key?: string): Promise<EncryptNotepadAction> {
	// Notepad is unencrypted, just return it
	if (typeof shell.sections === 'object') return {
		notepad: await Translators.Json.toNotepadFromNotepad(shell),
		passkey: '',
		rememberKey: false
	};

	// Prompt for decryption
	const passkey: RememberMePromptRes | undefined = key != null
		? { secret: key, remember: false }
		: await Dialog.promptSecureRememberMe(`Please enter the passkey for ${shell.title}:`);

	if (!passkey) throw new DecryptionError(new Error(`Can't decrypt notepad: ${shell.title}`));

	let notepad: Notepad;
	try {
		notepad = await decrypt(shell, passkey.secret);
	} catch (e) {
		const error = e instanceof Error ? e : new Error('' + e);
		throw new DecryptionError(error);
	}

	return {
		notepad,
		passkey: passkey.secret,
		rememberKey: passkey.remember
	};
}

export async function restoreSavedPasswords(store: MicroPadStore, storage: LocalForage): Promise<void> {
	const keys = await storage.keys();

	const forks: Promise<Action<AddCryptoPasskeyAction>>[] = keys.map(async notepadTitle =>
		store.dispatch(
			actions.addCryptoPasskey({
				notepadTitle,
				passkey: await storage.getItem<string>(notepadTitle) ?? '',
				remember: false // It's already remembered!
			})
		)
	);

	// Join
	await Promise.all(forks);
}

export async function hasEncryptedNotebooks(storage: LocalForage): Promise<boolean> {
	return !!await storage.iterate<string, boolean | undefined>((notepadJson) => {
		try {
			const shell: NotepadShell = JSON.parse(notepadJson);
			if (!!shell.crypto) return true;
		} catch (_) {}
		return undefined;
	});
}
