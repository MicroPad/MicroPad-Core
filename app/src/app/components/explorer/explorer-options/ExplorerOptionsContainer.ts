import { connect } from 'react-redux';
import ExplorerOptionsComponent from './ExplorerOptionsComponent';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { actions } from '../../../actions';

export const explorerOptionsConnector = connect(
	(store: IStoreState) => ({
		colour: ThemeValues[store.app.theme].explorerContent
	}),
	dispatch => ({
		deleteNotepad: (title: string) => dispatch(actions.deleteNotepad(title)),
		deleteNotepadObject: internalId => dispatch(actions.deleteNotepadObject(internalId)),
		exportNotepad: () => dispatch(actions.exportNotepad()),
		renameNotepad: newTitle => dispatch(actions.renameNotepad.started(newTitle)),
		renameNotepadObject: params => dispatch(actions.renameNotepadObject(params)),
		encrypt: (_, passkey) => dispatch(actions.encryptNotepad(passkey)),
		loadNote: (ref: string) => dispatch(actions.loadNote.started(ref)),
		print: () => dispatch(actions.print.started(undefined))
	})
);

export default explorerOptionsConnector(ExplorerOptionsComponent);
