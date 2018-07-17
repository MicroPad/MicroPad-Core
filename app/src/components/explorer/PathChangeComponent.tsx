import * as React from 'react';
import { FlatNotepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { Input } from 'react-materialize';

export interface IPathChangeComponentProps {
	notepad?: FlatNotepad;
	moveObj?: (ref: string, newParent: string, type: 'section' | 'note') => void;
}
export const PathChangeComponent = (props: IPathChangeComponentProps & { objToEdit: NPXObject; type: 'section' | 'note' }) => {
	const { notepad, objToEdit, type, moveObj } = props;
	if (!notepad || !moveObj) return null;

	const parentList: (FlatNotepad|FlatSection)[][] = [
		[notepad],
		...Object.values(notepad.sections)
			.map(section => [...notepad.pathFrom(section), section])
	].sort();

	return (
		<div>
			<strong>Move {type}</strong><br />
			<select
				defaultValue={(objToEdit.parent as any).internalRef || 'notepad'}
				style={{ display: 'block' }}
				onChange={event => moveObj(objToEdit.internalRef, event.currentTarget.value, type)}>
				{
					parentList
						.filter(parent => type === 'section' || parent.length > 1)
						.map(parent => {
							const text = parent.map(item => item.title).join(' > ');
							return (
								<option
									key={text}
									value={(parent.slice(-1)[0] as FlatSection).internalRef || 'notepad'}>
									{text}
								</option>
							);
						})
				}
			</select>
		</div>
	);
};

export default PathChangeComponent;
