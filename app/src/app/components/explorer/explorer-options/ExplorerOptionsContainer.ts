import { connect } from 'react-redux';
import ExplorerOptionsComponent, { ExplorerOptionsProps } from './ExplorerOptionsComponent';
import { IStoreState, SYNC_NAME } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { actions } from '../../../actions';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import { Dialog } from '../../../services/dialogs';
import { Notepad } from 'upad-parse';

export const explorerOptionsConnector = connect(
	(store: IStoreState) => ({
		colour: ThemeValues[store.app.theme].explorerContent,
		syncId: store.notepads.notepad?.activeSyncId
	}),
	(dispatch, directProps: ExplorerOptionsProps) => ({
		rename: (newName: string) => {
			dispatch(actions.closeModal());
			switch (directProps.type) {
				case 'notepad':
					dispatch(actions.renameNotepad.started(newName));
					break;

				case 'section':
				case 'note':
					dispatch(actions.renameNotepadObject({ internalRef: (directProps.objToEdit as NPXObject).internalRef, newName }));
					break;
			}
		},
		deleteObj: async () => {
			if (!await Dialog.confirm(`Are you sure you want to delete '${directProps.objToEdit.title}'?`)) return;
			dispatch(actions.closeModal());

			switch (directProps.type) {
				case 'notepad':
					dispatch(actions.deleteNotepad(directProps.objToEdit.title));
					break;

				case 'section':
				case 'note':
					dispatch(actions.deleteNotepadObject((directProps.objToEdit as NPXObject).internalRef));
					break;
			}
		},
		encrypt: async () => {
			const notepad = directProps.objToEdit as Notepad;

			if (!await Dialog.confirm(`Are you sure you want to encrypt '${notepad.title}'? This will secure all of your note's text contents and the structure of the notebook. Images and other binary assets are not encrypted.`)) return;

			const passkey = await Dialog.promptSecure('Passkey:');
			if (!passkey) return;

			if (await Dialog.promptSecure('Confirm Passkey:') !== passkey) {
				await Dialog.alert('Your two passkeys did not match');
				return;
			}

			dispatch(actions.encryptNotepad(passkey))
		},
		stopSyncing: async (syncId: string) => {
			if (!await Dialog.confirm(`Are you sure you want to remove ${directProps.objToEdit.title} from ${SYNC_NAME}?`)) return;
			dispatch(actions.deleteFromSync.started(syncId));
		},
		exportNotepad: () => dispatch(actions.exportNotepad()),
		loadNote: (ref: string) => dispatch(actions.loadNote.started(ref)),
		print: () => dispatch(actions.print.started())
	})
);

export default explorerOptionsConnector(ExplorerOptionsComponent);
