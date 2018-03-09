import * as React from 'react';
import './NoteViewerComponent.css';
import { INote } from '../../types/NotepadTypes';

export interface INoteViewerComponentProps {
	isFullscreen: boolean;
	note?: INote;
}

export default class NoteViewerComponent extends React.Component<INoteViewerComponentProps> {
	render() {
		const { isFullscreen, note } = this.props;

		const classes: string = !note ? 'empty' : '';
		let styles = {};

		if (isFullscreen) styles = {
			...styles,
			width: '100vw'
		};

		const containerStyles = {
			minWidth: '100%',
			minHeight: '100%',
			position: 'relative' as 'relative'
		};

		return (
			<div id="note-viewer" className={classes} style={styles}>
				<div id="note-container" style={containerStyles}>
					{!!note && <p style={{position: 'absolute', paddingRight: '100px', paddingBottom: '100px'}}>{note.elements[0].content}</p>}
				</div>
			</div>
		);
	}
}
