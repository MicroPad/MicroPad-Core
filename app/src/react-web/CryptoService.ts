import { NotepadShell } from 'upad-parse/dist/interfaces';
import { Notepad, Translators } from 'upad-parse/dist';
import { Dialog } from './dialogs';
import { decrypt } from 'upad-parse/dist/crypto';
import { EncryptNotepadAction } from '../core/types/ActionTypes';

export async function fromShell(shell: NotepadShell, key?: string): Promise<EncryptNotepadAction> {
	// Notepad is unencrypted, just return it
	if (typeof shell.sections === 'object') return { notepad: await Translators.Json.toNotepadFromNotepad(shell), passkey: '' };

	// Prompt for decryption
	const passkey = key || await Dialog.promptSecure(`Please enter the passkey for ${shell.title}:`);
	if (!passkey) throw new Error(`Can't decrypt notepad: ${shell.title}`);

	let notepad: Notepad;
	try {
		notepad = await decrypt(shell, passkey);
	} catch (e) {
		Dialog.alert(e.message);
		throw e;
	}

	return {
		notepad,
		passkey
	};
}
