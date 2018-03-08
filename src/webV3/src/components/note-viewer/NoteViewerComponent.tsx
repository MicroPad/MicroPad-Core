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

		return (
			<div id="note-viewer" className={classes} style={styles} />
		);
	}
}
