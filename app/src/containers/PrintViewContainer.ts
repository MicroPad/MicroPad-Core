import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import { getNotepadObjectByRef } from '../util';
import { INote } from '../types/NotepadTypes';
import PrintViewOrAppContainerComponent, { IPrintViewComponentProps } from '../components/printing/PrintViewOrAppContainerComponent';
import { Action } from 'redux';
import { actions } from '../actions';

export function mapStateToProps({ notepads, currentNote, print }: IStoreState) {
	let note: INote | undefined = undefined;
	if (currentNote.ref.length !== 0) {
		getNotepadObjectByRef(notepads.notepad!.item!, currentNote.ref, obj => note = <INote> obj);
	}

	return <IPrintViewComponentProps> {
		note,
		printElement: print.elementToPrint
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IPrintViewComponentProps> {
	return {
		clearPrintView: () => dispatch(actions.clearPrintView(undefined))
	};
}

export default connect<IPrintViewComponentProps>(mapStateToProps, mapDispatchToProps)(PrintViewOrAppContainerComponent);
