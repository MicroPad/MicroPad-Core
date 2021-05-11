import { connect } from 'react-redux';
import MoveComponent, { MoveComponentExplicitProps } from './MoveComponent';
import { IStoreState } from '../../../types';
import { actions } from '../../../actions';
import { MoveAcrossNotepadsObjType } from '../../../types/ActionTypes';
import { unreachable } from '../../../util';
import { FlatNotepad } from 'upad-parse/dist';

export const moveConnector = connect(
	(state: IStoreState) => ({
		currentNotepad: state.notepads.notepad?.item,
		notepadTitles: state.notepads.savedNotepadTitles ?? []
	}),
	(dispatch, props: MoveComponentExplicitProps) => ({
		move: (newNotepadTitle: string, oldNotepad: FlatNotepad) => {
			let type: MoveAcrossNotepadsObjType;
			switch (props.type) {
				case 'section':
					type = MoveAcrossNotepadsObjType.SECTION;
					break;
				case 'note':
					type = MoveAcrossNotepadsObjType.NOTE
					break;
				default:
					throw unreachable();
			}

			dispatch(actions.moveObjAcrossNotepads.started({
				newNotepadTitle,
				internalRef: props.internalRef,
				oldNotepad,
				type
			}))
			props.changed();
		}
	})
);

export default moveConnector(MoveComponent);
