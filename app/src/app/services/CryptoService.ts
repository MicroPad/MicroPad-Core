import { NotepadShell } from 'upad-parse/dist/interfaces';
import { Notepad, Translators } from 'upad-parse/dist';
import { Dialog, RememberMePromptRes } from './dialogs';
import { decrypt } from 'upad-parse/dist/crypto';
import { EncryptNotepadAction } from '../types/ActionTypes';

export class DecryptionError extends Error {
	constructor (error: Error) {
		super(error.message);
		this.name = error.name;
		this.stack = error.stack;
	}
}

export async function fromShell(shell: NotepadShell, key?: string): Promise<EncryptNotepadAction> {
	// Notepad is unencrypted, just return it
	if (typeof shell.sections === 'object') return { notepad: await Translators.Json.toNotepadFromNotepad(shell), passkey: '' };

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
