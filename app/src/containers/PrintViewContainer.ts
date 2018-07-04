import { IStoreState } from '../types';
import { connect, Dispatch } from 'react-redux';
import PrintViewOrAppContainerComponent, { IPrintViewComponentProps } from '../components/printing/PrintViewOrAppContainerComponent';
import { Action } from 'redux';
import { actions } from '../actions';
import { Note } from 'upad-parse/dist';

export function mapStateToProps({ notepads, currentNote, print }: IStoreState) {
	let note: Note | undefined = undefined;
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
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
