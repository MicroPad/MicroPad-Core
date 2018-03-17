import * as React from 'react';
import './NoteViewerComponent.css';
import { INote } from '../../types/NotepadTypes';
import NoteElementComponent from './elements/NoteElementComponent';
import * as Materialize from 'materialize-css/dist/js/materialize.js';
import * as md5 from 'md5';

export interface INoteViewerComponentProps {
	isFullscreen: boolean;
	note?: INote;
	noteAssets: object;
	search?: (query: string) => void;
}

export default class NoteViewerComponent extends React.Component<INoteViewerComponentProps> {
	render() {
		const { isFullscreen, note, noteAssets, search } = this.props;

		const classes: string = (!note || note.elements.length === 0) ? 'empty' : '';
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
			<NoteElementComponent key={md5(JSON.stringify(element))} element={element} noteAssets={noteAssets} search={search!} />
		));

		if (!!note && elements.length === 0) Materialize.toast('Welcome to your note! Press anywhere on here to insert an element.', 3000);

		return (
			<div id="note-viewer" className={classes} style={styles}>
				<div id="note-container" style={containerStyles}>
					{elements}
				</div>
			</div>
		);
	}
}
