import * as React from 'react';
import { FlatNotepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { ConnectedProps } from 'react-redux';
import { pathChangeConnector } from './PathChangeContainer';

type Props = ConnectedProps<typeof pathChangeConnector> & {
	objToEdit: NPXObject;
	type: 'section' | 'note';
	changed: () => void;
};

export const PathChangeComponent = (props: Props) => {
	const { notepad, objToEdit, type, moveObj, changed } = props;
	if (!notepad) return null;

	const parentList: Array<Array<FlatNotepad | FlatSection>> = [
		[notepad],
		...Object.values(notepad.sections)
			.map((section: FlatSection) => [...notepad.pathFrom(section), section])
			.filter(items => !items.some((item: unknown) => {
				// Exclude any options which could result on a section being moved into itself
				const section = item as FlatSection;
				return !!section.internalRef && section.internalRef === objToEdit.internalRef;
			}))
	];

	return (
		<div>
			<strong>Move {type}</strong><br />
			<select
				defaultValue={(objToEdit.parent as any).internalRef || 'notepad'}
				style={{ display: 'block' }}
				onChange={event => {
					moveObj(objToEdit.internalRef, event.currentTarget.value, type);
					if (!!changed) changed();
				}}>
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
