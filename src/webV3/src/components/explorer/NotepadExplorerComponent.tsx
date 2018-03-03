import * as React from 'react';
import './NotepadExplorerComponent.css';
import { INote, INotepad } from '../../types/NotepadTypes';

export interface INotepadExplorerComponentProps {
	notepad?: INotepad;
	currentNote?: INote;
}

export default class NotepadExplorerComponent extends React.Component<INotepadExplorerComponentProps> {
	render() {
		const { notepad, currentNote } = this.props;

		return (
			<div id="notepad-explorer">
				{
					!!notepad &&
					<div>
						<a href="#!" style={{color: 'white', paddingRight: '5px', fontSize: '24px'}}>»</a>
						<strong>Notepad Explorer (<em>{notepad.title}</em>)</strong>
					</div>
				}
			</div>
		);
	}
}
