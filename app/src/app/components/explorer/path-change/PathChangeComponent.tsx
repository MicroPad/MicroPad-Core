import React from 'react';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import { FlatSection } from 'upad-parse/dist/FlatNotepad';
import { ConnectedProps } from 'react-redux';
import { getParentList, pathChangeConnector } from './PathChangeContainer';

type Props = ConnectedProps<typeof pathChangeConnector> & {
	objToEdit: NPXObject;
	type: 'section' | 'note';
};

const PathChangeComponent = (props: Props) => {
	const { notepad, objToEdit, type, moveObj } = props;
	if (!notepad) return null;

	return (
		<div className="explorer-options-modal__path-change">
			<h5>Move {type}</h5>
			<select
				defaultValue={(objToEdit.parent as any).internalRef || 'notepad'}
				style={{ display: 'block', width: 'max-content' }}
				onChange={event => {
					moveObj(objToEdit.internalRef, event.currentTarget.value, type);
				}}>
				{
					getParentList(notepad, objToEdit.internalRef)
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
