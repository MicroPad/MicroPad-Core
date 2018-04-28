import { INoteElementComponentProps } from '../NoteElementComponent';
import * as React from 'react';
import { dataURItoBlob } from '../../../../util';
import { trim } from './trim-canvas';

type Offset = {
	top: number;
	left: number;
};

type Touch = {
	identifier: number;
	pageX: number;
	pageY: number;
};

type Position = {
	x: number,
	y: number
};

export default class DrawingElementComponent extends React.Component<INoteElementComponentProps> {
	private imageElement: HTMLImageElement;
	private hasTrimmed: boolean;

	private canvasElement: HTMLCanvasElement;
	private canvasOffset: Offset;
	private ctx: CanvasRenderingContext2D;
	private ongoingTouches: Touch[] = [];

	render() {
		const { element, noteAssets, elementEditing } = this.props;
		const isEditing = element.args.id === elementEditing;

		this.hasTrimmed = false;

		if (isEditing) {
			return (
				<div style={{padding: '5px'}}>
					<canvas
						ref={e => this.canvasElement = e!}

						width="800"
						height="600"
						style={{border: 'solid black 1px', touchAction: 'none'}} />
				</div>
			);
		}

		return (
			<div style={{overflow: 'hidden', height: element.args.height}} onClick={this.openEditor}>
				<img ref={elm => this.imageElement = elm!} style={{height: element.args.height, width: element.args.width }} src={noteAssets[element.args.ext!]} />
			</div>
		);
	}

	componentDidUpdate() {
		if (this.canvasElement) this.initCanvas();

		if (!this.imageElement) return;
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

	componentWillUnmount() {
		window.onresize = () => { return; };
		this.initCanvas();
	}

	private initCanvas = () => {
		window.onresize = () => this.resizeCanvas();

		this.ctx = this.canvasElement.getContext('2d')!;
		let ongoingPos: Position;
		this.resizeCanvas();

		this.ctx.strokeStyle = '#000000';

		this.canvasElement.onpointerdown = event => {
			console.log(event);
			this.ongoingTouches.push(this.copyTouch(event));
			this.ctx.beginPath();
		};

		this.canvasElement.onpointermove = event => {
			const pos = this.getRealPosition(this.copyTouch(event));
			const idx = this.ongoingTouchIndexById(event.pointerId);
			if (idx < 0) return;

			if (event.pressure < 0) return;

			this.ctx.beginPath();
			ongoingPos = this.getRealPosition(this.ongoingTouches[idx]);
			this.ctx.moveTo(ongoingPos.x, ongoingPos.y);
			this.ctx.lineTo(pos.x, pos.y);
			this.ctx.lineWidth = event.pressure * 10;
			this.ctx.lineCap = 'round';
			this.ctx.stroke();

			this.ongoingTouches.splice(idx, 1, this.copyTouch(event));
		};

		this.canvasElement.onpointerup = event => {
			const pos = this.getRealPosition(this.copyTouch(event));
			const idx = this.ongoingTouchIndexById(event.pointerId);
			if (idx < 0) return;

			this.ctx.lineWidth = (event.pressure > 0) ? event.pressure * 10 : 1;
			this.ctx.fillStyle = '#000000';
			this.ctx.beginPath();
			ongoingPos = this.getRealPosition(this.ongoingTouches[idx]);

			this.ctx.moveTo(ongoingPos.x, ongoingPos.y);
			this.ctx.lineTo(pos.x, pos.y);

			this.ongoingTouches.splice(idx, 1);
		};

		this.canvasElement.onpointercancel = event => {
			const idx = this.ongoingTouchIndexById(event.pointerId);
			this.ongoingTouches.splice(idx, 1);
		};
	}

	private copyTouch = (event: PointerEvent): Touch => {
		return {
			identifier: event.pointerId,
			pageX: event.pageX,
			pageY: event.pageY
		};
	}

	private getRealPosition = (touch: Touch): Position => {
		if (!touch.pageX) debugger;
		return {
			x: touch.pageX - this.canvasOffset.left,
			y: touch.pageY - this.canvasOffset.top
		};
	}

	private resizeCanvas = () => {
		const boundingBox = this.canvasElement.getBoundingClientRect();
		this.canvasOffset = {
			top: boundingBox.top + document.body.scrollTop,
			left: boundingBox.left + document.body.scrollLeft
		};
	}

	private ongoingTouchIndexById = (id: number): number => {
		for (let i = 0; i < this.ongoingTouches.length; i++) {
			if (id === this.ongoingTouches[i].identifier) return i;
		}

		return -1;
	}

	private openEditor = () => {
		const { element, edit } = this.props;

		edit(element.args.id);
	}
}
