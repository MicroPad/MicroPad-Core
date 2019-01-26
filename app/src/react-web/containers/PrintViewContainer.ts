import { IStoreState } from '../types';
import { connect } from 'react-redux';
import PrintViewOrAppContainerComponent, {
	IAppProps,
	IPrintViewComponentProps
} from '../components/printing/PrintViewOrAppContainerComponent';
import { Action, Dispatch } from 'redux';
import { actions } from '../actions';
import { Note } from 'upad-parse/dist';
import { ThemeValues } from '../ThemeValues';

export function mapStateToProps({ notepads, currentNote, print, app }: IStoreState) {
	let note: Note | undefined = undefined;
	if (currentNote.ref.length !== 0) {
		note = notepads.notepad!.item!.notes[currentNote.ref];
	}

	return <IPrintViewComponentProps & IAppProps> {
		note,
		printElement: print.elementToPrint,
		theme: ThemeValues[app.theme],
		themeName: app.theme
	};
}

export function mapDispatchToProps(dispatch: Dispatch<Action>): Partial<IPrintViewComponentProps> {
	return {
		clearPrintView: () => dispatch(actions.clearPrintView(undefined))
	};
}

export default connect<IPrintViewComponentProps & IAppProps>(mapStateToProps, mapDispatchToProps)(PrintViewOrAppContainerComponent);
