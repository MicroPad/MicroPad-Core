import { INoteElementComponentProps } from '../NoteElementComponent';
import * as React from 'react';
import { dataURItoBlob } from '../../../../util';
import { trim } from './trim-canvas';

export default class DrawingElementComponent extends React.Component<INoteElementComponentProps> {
	private imageElement: HTMLImageElement;
	private hasTrimmed;

	render() {
		const { element, noteAssets } = this.props;

		this.hasTrimmed = false;

		return (
			<div style={{overflow: 'hidden', height: element.args.height}}>
				<img ref={elm => this.imageElement = elm!} style={{height: element.args.height, width: element.args.width }} src={noteAssets[element.args.ext!]} />
			</div>
		);
	}

	componentDidMount() {
		this.imageElement.onload = () => {
			if (this.hasTrimmed) return;

			const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
			tmpCanvas.setAttribute('width', this.imageElement.naturalWidth.toString());
			tmpCanvas.setAttribute('height', this.imageElement.naturalHeight.toString());

			const tmpContext = tmpCanvas.getContext('2d')!;
			tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
			tmpContext.drawImage(this.imageElement, 0, 0);

			this.hasTrimmed = true;
			this.imageElement.src = URL.createObjectURL(dataURItoBlob(trim(tmpCanvas).toDataURL()));
		};
	}
}
