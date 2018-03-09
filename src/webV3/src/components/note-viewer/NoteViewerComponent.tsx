import * as React from 'react';
import './NoteViewerComponent.css';
import { INote } from '../../types/NotepadTypes';
import NoteElementComponent from './elements/NoteElementComponent';
import { generateGuid } from 'src/util';

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

		const elements: JSX.Element[] = [];
		if (!!note) note.elements.forEach(element => elements.push(
			<NoteElementComponent key={generateGuid()} element={element} />
		));

		return (
			<div id="note-viewer" className={classes} style={styles}>
				<div id="note-container" style={containerStyles}>
					{elements}
				</div>
			</div>
		);
	}
}
