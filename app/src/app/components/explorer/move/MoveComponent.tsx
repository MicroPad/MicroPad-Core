import * as React from 'react';
import { ConnectedProps } from 'react-redux';
import { moveConnector } from './MoveContainer';

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
		<div>
			<h5>Move {props.type} to another notebook</h5>
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
