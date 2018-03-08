import * as React from 'react';
import './NoteViewerComponent.css';

export interface INoteViewerComponentProps {
	isFullscreen: boolean;
}

export default class NoteViewerComponent extends React.Component<INoteViewerComponentProps> {
	render() {
		const { isFullscreen } = this.props;

		const classes: string = 'empty';
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
