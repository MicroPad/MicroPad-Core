import { IStoreState } from '../../../types';
import { connect } from 'react-redux';
import SourcesComponent from './SourcesComponent';
import { actions } from '../../../actions';
import { Source } from 'upad-parse/dist/Note';

export const sourcesConnector = connect(
	({ notepads, currentNote }: IStoreState) => {
		const note = currentNote.ref.length ? notepads.notepad?.item?.notes?.[currentNote.ref] : undefined;

		return {
			note,
			element: note?.elements?.filter(e => e.args.id === currentNote.elementEditing)[0]
		};
	},
	(dispatch) => ({
		updateBibliography: (bibliography: Source[], noteRef: string) =>
			dispatch(actions.updateBibliography({ sources: bibliography, noteRef }))
	})
);
export default sourcesConnector(SourcesComponent);
