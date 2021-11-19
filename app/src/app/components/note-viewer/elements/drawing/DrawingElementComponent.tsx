import { INoteElementComponentProps } from '../NoteElementComponent';
import React from 'react';
import { trim } from './trim-canvas';
import { Resizable } from 're-resizable';
// Remove unused imports later
import { Row, Select } from 'react-materialize';

import * as FullScreenService from '../../../../services/FullscreenService';
import { ConnectedProps } from 'react-redux';
import { drawingElementConnector } from './DrawingElementContainer';
import { DrawMode } from '../../../../reducers/EditorReducer';
import DrawingCanvas from './DrawingCanvas';

type Position = {
	x: number,
	y: number
};

const rainbow = [
	'#E70000',
	'#FF8C00',
	'#FFEF00',
	'#00811F',
	'#0044FF',
	'#760089'
];

// Are modes here still necessary?
const modes = {
	COLOUR: 'Colour',
	RAINBOW: 'Rainbow',
	ERASER: 'Eraser',
};

type Props = ConnectedProps<typeof drawingElementConnector> & INoteElementComponentProps;


export default class DrawingElementComponent extends React.Component<Props> {
	private readonly supportsPointerEvents = typeof window.onpointerdown === 'object';

	private imageElement!: HTMLImageElement;
	private hasTrimmed!: boolean;

	private canvasElement: HTMLCanvasElement | null = null;
	private ctx!: CanvasRenderingContext2D;
	private ongoingTouches = new OngoingTouches();
	private canvasImage?: Blob | null;

	// Are modes still necessary?
	private drawingMode = modes.COLOUR;
	private drawColour = "#000000";

	private rainbowIndex = 0;

	private setDrawColour = (e, colour) => {
		this.drawColour = colour;
		this.drawingMode = "Colour";
		this.props.setDrawingLineColour(colour);
		this.props.setDrawMode(DrawMode.Line);
	}

	render() {
		const { element, noteAssets, elementEditing, theme } = this.props;
		if (!theme) return null;

		const isEditing = element.args.id === elementEditing;
		this.hasTrimmed = false;

		if (isEditing) {
			return (
				<div>
					<Resizable
						style={{ padding: '5px', overflow: 'hidden' }}
						minWidth={410}
						minHeight={130}
						lockAspectRatio={true}
						onResizeStart={() => {
							this.canvasElement?.toBlob(result => this.canvasImage = result, 'image/png', 1);
						}}
						onResize={(e, d, ref) => {
							const canvasElement = this.canvasElement;
							if (!canvasElement) return;
							canvasElement.width = parseInt(ref.style.width!, 10) - 10;
							canvasElement.height = parseInt(ref.style.height!, 10) - 10;

							if (!!this.canvasImage) {
								const img = new Image();
								img.onload = () => this.ctx.drawImage(img, 0, 0);
								img.src = URL.createObjectURL(this.canvasImage);
							}
						}}
						onResizeStop={() => {
							if (!!this.canvasImage) {
								const img = new Image();
								img.onload = () => this.ctx.drawImage(img, 0, 0);
								img.src = URL.createObjectURL(this.canvasImage);
								this.canvasImage = null;
							}
						}}
						>
						<DrawingCanvas
							// @ts-expect-error
							ref={(e: DrawingCanvas | undefined) => this.canvasElement = e?.inner ?? null}
							key={`drawing-canvas-${this.props.element.args.id}`}
							width="500"
							height="450"
							style={{ border: 'solid black 1px', touchAction: 'none' }} />
					</Resizable>

					<Row style={{ padding: '5px' }}>
						<input type="text" value={this.props.drawMode} onChange={e => {}} />
						<input type="color" list="mp-drawing-colours" value={this.props.drawingLineColour} onChange={e => this.setDrawColour(e, e.target.value)}/>
						<datalist key="mp-drawing-colours" id="mp-drawing-colours">
							<option value="#000000">Black</option>
							<option value="#FFFFFF">White</option>
							<option value="#E70000">Red</option>
							<option value="#FFEF00">Yellow</option>
							<option value="#00811F">Green</option>
							<option value="#0044FF">Blue</option>
							<option value="#FF8C00">Orange</option>
							<option value="#760089">Purple</option>
						</datalist>
						<Select label="Drawing mode" multiple={false} value={this.props.drawMode} onChange={e => this.props.setDrawMode(e.target.value as DrawMode)}>
							<option value={DrawMode.Line}>Line</option>
							<option value={DrawMode.ERASE}>Erase</option>
							<option value={DrawMode.RAINBOW}>Rainbow Mode 🏳️‍🌈</option>
						</Select>
					</Row>
					{!this.supportsPointerEvents && <p><em>Your browser seems to not support pointer events. Drawing may not work.</em></p>}
				</div>
			);
		}

		return (
			<div style={{
				overflow: 'hidden',
				height: 'auto',
				minWidth: '170px',
				minHeight: '130px',
				backgroundColor: !isEditing ? theme.drawingBackground : undefined
			}} onClick={this.openEditor}>
				<img ref={elm => this.imageElement = elm!} style={{ height: 'auto', width: 'auto', minWidth: '0px', minHeight: '0px' }} src={noteAssets[element.args.ext!]} alt="" />
			</div>
		);
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const { element, noteAssets } = this.props;

		this.ongoingTouches = new OngoingTouches();

		const canvasElement = this.canvasElement;
		if (!!canvasElement) {

			this.initCanvas();

			// Restore saved image to canvas
			const img = new Image();
			img.onload = () => {
				const canvasElement = this.canvasElement;
				if (!canvasElement) return;
				canvasElement.width = img.naturalWidth;
				canvasElement.height = img.naturalHeight;
				this.ctx.drawImage(img, 0, 0);
			};
			img.src = noteAssets[element.args.ext!];
			return;
		}

		this.imageElement.onload = () => {
			if (this.hasTrimmed) return;

			const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
			tmpCanvas.setAttribute('width', this.imageElement.naturalWidth.toString());
			tmpCanvas.setAttribute('height', this.imageElement.naturalHeight.toString());

			const tmpContext = tmpCanvas.getContext('2d')!;
			tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
			tmpContext.drawImage(this.imageElement, 0, 0);

			this.hasTrimmed = true;
			const drawingBlob$ = new Promise<Blob | null>(resolve => trim(tmpCanvas).toBlob(blob => resolve(blob)));
			drawingBlob$.then(drawingBlob => this.imageElement.src = URL.createObjectURL(drawingBlob));
		};
	}

	override getSnapshotBeforeUpdate(prevProps: Readonly<Props>, prevState) {
		const { element, updateElement } = prevProps;
		if (!this.canvasElement || this.props.elementEditing === prevProps.elementEditing) return null;

		// Update element with canvas contents replacing the old asset
		const drawingBlob$ = new Promise<Blob | null>(resolve => this.canvasElement?.toBlob(blob => resolve(blob)));
		drawingBlob$.then(drawingBlob => updateElement!(element.args.id, element, drawingBlob ?? undefined));

		return null;
	}

	private initCanvas = () => {
		const canvasElement = this.canvasElement;
		if (!canvasElement) {
			console.error(`Missing canvas element`);
			return;
		}

		this.ctx = canvasElement.getContext('2d')!;

		canvasElement.onpointerdown = event => {
			this.ongoingTouches.setTouch(event);
			this.ctx.beginPath();
		};

		canvasElement.onpointermove = event => {
			if (!this.ongoingTouches.touches[event.pointerId]) return;

			this.ctx.strokeStyle = this.getLineStyle();

			const pos = this.getRealPosition(new Touch(event));

			if (this.shouldErase(event)) {
				const radius = 10;
				this.ctx.save();
				const ongoingPos = this.getRealPosition(this.ongoingTouches.getTouch(event));
				this.fillLineShape(ongoingPos, pos, radius);
				this.ctx.clip();
				this.ctx.clearRect(
					0,
					0,
					this.ctx.canvas.width,
					this.ctx.canvas.height);
				this.ctx.restore();
				this.ongoingTouches.setTouch(event);
				return;
			}

			this.ctx.beginPath();
			const ongoingPos = this.getRealPosition(this.ongoingTouches.getTouch(event));
			this.ctx.moveTo(ongoingPos.x, ongoingPos.y);
			this.ctx.lineTo(pos.x, pos.y);
			this.ctx.lineWidth = event.pressure * 10;
			this.ctx.lineCap = 'round';
			this.ctx.stroke();

			this.ongoingTouches.setTouch(event);
		};

		canvasElement.onpointerup = event => {
			const pos = this.getRealPosition(new Touch(event));

			this.ctx.lineWidth = event.pressure * 10;
			this.ctx.fillStyle = this.getLineStyle();
			this.ctx.beginPath();
			const ongoingPos = this.getRealPosition(this.ongoingTouches.getTouch(event));

			this.ctx.moveTo(ongoingPos.x, ongoingPos.y);
			this.ctx.lineTo(pos.x, pos.y);

			this.ongoingTouches.deleteTouch(event.pointerId);
		};

		canvasElement.onpointercancel = event => {
			this.ongoingTouches.deleteTouch(event.pointerId);
		};

		canvasElement.onpointerleave = event => {
			this.ongoingTouches.deleteTouch(event.pointerId);
		}

		canvasElement.onpointerenter = event => {
			// In macOS Safari, pressure is always equal to 0
			// In desktop Chrome, pressure is equal to 0.5 if the mouse button is held down
			if (event.pressure > 0) {
				this.ongoingTouches.setTouch(event);
			}
		}
	}

	private getRealPosition = (touch: Touch): Position => {
		const { element, isFullScreen } = this.props;

		const noteViewer = document.getElementById('note-viewer')!;
		const notepadExplorerWidth = document.querySelector<HTMLDivElement>('.notepad-explorer')?.offsetWidth ?? 0;

		const canvasOffset = {
			left: (parseInt(element.args.x, 10) + notepadExplorerWidth) - noteViewer.scrollLeft,
			top: (parseInt(element.args.y, 10) + FullScreenService.getOffset(isFullScreen)) - noteViewer.scrollTop
		};

		const scale = parseFloat(document.getElementById('note-container')!.style.transform!.split('(')[1].slice(0, -1));
		return {
			x: (touch.x - canvasOffset.left) * scale,
			y: (touch.y - canvasOffset.top) * scale
		};
	}

	private shouldErase = (event: PointerEvent): boolean => {
		return this.props.drawMode === DrawMode.ERASE || event.buttons === 32;
	}

	private getLineStyle = (): string => {
		// Increment through the colours of the rainbow and reset to the beginning when reaching the last colour
		//const newIndex = (this.drawingMode === modes.RAINBOW)
		const newIndex = (this.props.drawMode === DrawMode.RAINBOW)
			? (this.rainbowIndex < rainbow.length - 1)
				? 1
				: this.rainbowIndex * -1
			: this.rainbowIndex;

		return (this.props.drawMode === DrawMode.RAINBOW) ? rainbow[this.rainbowIndex += newIndex] : this.props.drawingLineColour;
	}

	// Draws the outline of a line from pos1 to pos2 with the given width
	private fillLineShape = (pos1: Position, pos2: Position, width: number) => {
		const x1 = pos1.x, y1 = pos1.y, x2 = pos2.x, y2 = pos2.y;
		const dx = (x2 - x1);
		const dy = (y2 - y1);
		// length must not be zero
		const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
		const shiftx = -dy * width / length;
		const shifty = dx * width / length;
		this.ctx.beginPath();
		this.ctx.moveTo(x1 + shiftx, y1 + shifty);
		this.ctx.lineTo(x1 - shiftx, y1 - shifty);
		this.ctx.lineTo(x2 - shiftx, y2 - shifty);
		this.ctx.lineTo(x2 + shiftx, y2 + shifty);
		this.ctx.closePath();
		// draw round end caps
		this.ctx.arc(x1, y1, width, 0, 2 * Math.PI, false);
		this.ctx.arc(x2, y2, width, 0, 2 * Math.PI, false);
	}

	private openEditor = () => {
		const { element, edit } = this.props;

		edit(element.args.id);
	}
}

class Touch {
	identifier: number;
	x: number;
	y: number;

	constructor(event: PointerEvent) {
		this.identifier = event.pointerId;
		this.x = event.clientX;
		this.y = event.clientY;
	}
}

class OngoingTouches {
	touches: { [id: number]: Touch | null } = {};

	getTouch(event: PointerEvent): Touch {
		return this.touches[event.pointerId] || new Touch(event);
	}

	setTouch(event: PointerEvent) {
		this.touches[event.pointerId] = new Touch(event);
	}

	deleteTouch(id: number) {
		this.touches[id] = null;
	}
}
