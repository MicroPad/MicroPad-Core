import { IStoreState } from '../types';
import { connect } from 'react-redux';
import { getNotepadObjectByRef } from '../util';
import { INote } from '../types/NotepadTypes';
import PrintViewComponent, { IPrintViewComponentProps } from '../components/printing/PrintViewComponent';

export function mapStateToProps({ notepads, currentNote }: IStoreState) {
	let note: INote | undefined = undefined;
	if (currentNote.ref.length !== 0) {
		getNotepadObjectByRef(notepads.notepad!.item!, currentNote.ref, obj => note = <INote> obj);
	}

	return <IPrintViewComponentProps> {
		note,
		noteAssets: currentNote.assetUrls
	};
}

export default connect<IPrintViewComponentProps>(mapStateToProps)(PrintViewComponent);
