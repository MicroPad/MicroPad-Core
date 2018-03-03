import * as React from 'react';
import './NotepadExplorerComponent.css';
import { INote, INotepad } from '../../types/NotepadTypes';
import { Icon } from 'react-materialize';

export interface INotepadExplorerComponentProps {
	notepad?: INotepad;
	currentNote?: INote;
	isFullScreen: boolean;
	flipFullScreenState?: () => void;
}

export default class NotepadExplorerComponent extends React.Component<INotepadExplorerComponentProps> {
	render() {
		const { notepad, currentNote, isFullScreen, flipFullScreenState } = this.props;

		const notepadExplorerStyle = {
			display: 'initial'
		};
		if (isFullScreen) notepadExplorerStyle.display = 'none';

		return (
			<div id="notepad-explorer" style={notepadExplorerStyle}>
				<Icon right={true}>explore</Icon>
				{
					!!notepad &&
					<div>
						<a href="#!" onClick={flipFullScreenState} style={{color: 'white', paddingRight: '5px', fontSize: '24px'}}>»</a>
						<strong>{notepad.title}</strong>
					</div>
				}
			</div>
		);
	}
}
