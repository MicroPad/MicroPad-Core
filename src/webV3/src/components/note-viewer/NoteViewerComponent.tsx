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
	private lastZoom: number | null;

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
			<div id="note-viewer" className={classes} style={styles}>
				<div id="note-container" style={containerStyles} ref={div => this.viewerDiv = div!}>
					{elements}
				</div>
			</div>
		);
	}

	// componentDidUpdate() {
	// 	if (!!this.props.note) {
	// 		this.viewerDiv.ontouchmove = this.handleScale;
	// 		this.viewerDiv.ontouchend = () => this.lastZoom = null;
	// 	}
	// }
	//
	// componentWillUnmount() {
	// 	if (!!this.props.note) this.viewerDiv.removeEventListener('touchmove', this.handleScale);
	// }
	//
	// private handleScale = (event: TouchEvent) => {
	// 	if (event.touches.length !== 2) return;
	//
	// 	const factor = Math.hypot(
	// 		event.touches[0].pageX - event.touches[1].pageX,
	// 		event.touches[0].pageY - event.touches[1].pageY
	// 	);
	//
	// 	if (!this.lastZoom) {
	// 		this.lastZoom = factor;
	// 		return;
	// 	}
	//
	// 	const oldScale: number = parseFloat(this.viewerDiv.style.transform!.split('scale(').pop()!.slice(0, -1) || '1');
	// 	console.log(oldScale);
	// 	const scaleFactor = (0.002 * Math.abs(factor - this.lastZoom));
	//
	// 	if (factor > this.lastZoom) {
	// 		// Zoom in
	// 		console.log('zoom in');
	// 		this.viewerDiv.style.transform = `scale(${oldScale + scaleFactor})`;
	// 	} else {
	// 		// Zoom out
	// 		console.log('zoom out');
	// 		this.viewerDiv.style.transform = `scale(${oldScale - scaleFactor})`;
	// 	}
	//
	// 	console.log(factor);
	// 	this.lastZoom = null;
	// }
}
