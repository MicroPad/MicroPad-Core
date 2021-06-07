import * as React from 'react';
import { ConnectedProps } from 'react-redux';
import { moveConnector } from './MoveContainer';
import { SYNC_NAME } from '../../../types';

export type Props = ConnectedProps<typeof moveConnector> & MoveComponentExplicitProps;
export type MoveComponentExplicitProps = {
	internalRef: string,
	type: 'section' | 'note',
	changed: () => void
};

const MoveComponent = (props: Props) => {
	const { currentNotepad } = props;
	if (!currentNotepad) return null;

	return (
		<div className="explorer-options-modal__move">
			<h5>Move {props.type} to another notebook</h5>
			<p>
				<em>
					If you use {SYNC_NAME}, make sure to open both notebooks after transferring the item
					to ensure that all changes have synced fully.
				</em>
			</p>
			<select
				defaultValue={currentNotepad.title}
				style={{ display: 'block', width: 'max-content' }}
				onChange={e => props.move(e.target.value, currentNotepad)}>
				{props.notepadTitles.map(title => (<option key={title} value={title}>{title}</option>))}
			</select>
		</div>
	);
}

export default MoveComponent;
