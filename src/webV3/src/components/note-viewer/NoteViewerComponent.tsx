import * as React from 'react';
import './NoteViewerComponent.css';
import { INote } from '../../types/NotepadTypes';
import NoteElementComponent from './elements/NoteElementComponent';
import * as Materialize from 'materialize-css/dist/js/materialize.js';
import * as md5 from 'md5';

export interface INoteViewerComponentProps {
	isFullscreen: boolean;
	note?: INote;
	elementEditing: string;
	noteAssets: object;
	edit?: (id: string) => void;
	search?: (query: string) => void;
	downloadAsset?: (filename: string, uuid: string) => void;
}

export default class NoteViewerComponent extends React.Component<INoteViewerComponentProps> {
	private viewerDiv: HTMLDivElement;

	render() {
		const { isFullscreen, note, noteAssets, search, downloadAsset, elementEditing, edit} = this.props;

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
			<NoteElementComponent
				key={md5(JSON.stringify(element))}
				element={element}
				noteAssets={noteAssets}
				edit={edit!}
				search={search!}
				downloadAsset={downloadAsset}
				elementEditing={elementEditing} />
		));

		if (!!note && elements.length === 0) Materialize.toast('Welcome to your note! Press anywhere on here to insert an element.', 3000);

		return (
			<div id="note-viewer" className={classes} style={styles} ref={div => this.viewerDiv = div!} onClick={this.handleEmptyClick}>
				<div id="note-container" style={containerStyles}>
					{elements}
				</div>
			</div>
		);
	}

	private handleEmptyClick = (event) => {
		const { note, edit } = this.props;
		if (!note || event.target !== this.viewerDiv) return;

		edit!('');
	}
}
