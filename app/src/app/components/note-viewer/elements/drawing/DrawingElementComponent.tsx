import { INoteElementComponentProps } from '../NoteElementComponent';
import * as React from 'react';
import { dataURItoBlob } from '../../../../util';
import { trim } from './trim-canvas';
import { Resizable } from 're-resizable';
import { Checkbox, Col, Row } from 'react-materialize';
import stringify from 'json-stringify-safe';
import * as FullScreenService from '../../../../services/FullscreenService';

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

export interface IDrawingElementComponentProps extends INoteElementComponentProps {
	isFullScreen: boolean;
}

export default class DrawingElementComponent extends React.Component<IDrawingElementComponentProps> {
	private readonly supportsPointerEvents = typeof window.onpointerdown === 'object';

	private imageElement!: HTMLImageElement;
	private hasTrimmed!: boolean;

	private canvasElement!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;
	private ongoingTouches = new OngoingTouches();
	private canvasImage?: Blob | null;

	private isErasing = false;
	private isRainbow = false;
	private rainbowIndex = 0;

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
							this.canvasElement.toBlob(result => this.canvasImage = result, 'image/png', 1);
						}}
						onResize={(e, d, ref) => {
							this.canvasElement.width = parseInt(ref.style.width!, 10) - 10;
							this.canvasElement.height = parseInt(ref.style.height!, 10) - 10;

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
						<canvas
							ref={e => this.canvasElement = e!}
							width="500"
							height="450"
							style={{ border: 'solid black 1px', touchAction: 'none' }} />
					</Resizable>

					<Row style={{ padding: '5px' }}>
						<Col>
							<Checkbox label="Erase Mode" value="1" checked={this.isErasing} filledIn onChange={e => this.isErasing = (e.target as HTMLInputElement).checked} />
						</Col>
						<Col>
							<Checkbox label="Rainbow Mode 🏳️‍🌈" value="1" checked={this.isRainbow} filledIn onChange={e => this.isRainbow = (e.target as HTMLInputElement).checked} />
						</Col>
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
		this.isErasing = false;
		this.isRainbow = false;
		if (!!this.canvasElement) {
			this.initCanvas();

			// Restore saved image to canvas
			const img = new Image();
			img.onload = () => {
				if (!this.canvasElement) return;
				this.canvasElement.width = img.naturalWidth;
				this.canvasElement.height = img.naturalHeight;
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
			this.imageElement.src = URL.createObjectURL(dataURItoBlob(trim(tmpCanvas).toDataURL()));
		};
	}

	shouldComponentUpdate(nextProps: INoteElementComponentProps) {
		return stringify(nextProps) !== stringify(this.props);
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		const { element, updateElement } = prevProps;
		if (!this.canvasElement) return null;

		// Update element with canvas contents replacing the old asset
		updateElement!(element.args.id, element, dataURItoBlob(this.canvasElement.toDataURL()));

		return null;
	}

	private initCanvas = () => {
		this.ctx = this.canvasElement.getContext('2d')!;

		this.canvasElement.onpointerdown = event => {
			this.ongoingTouches.setTouch(event);
			this.ctx.beginPath();
		};

		this.canvasElement.onpointermove = event => {
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

		this.canvasElement.onpointerup = event => {
			const pos = this.getRealPosition(new Touch(event));

			this.ctx.lineWidth = event.pressure * 10;
			this.ctx.fillStyle = this.getLineStyle();
			this.ctx.beginPath();
			const ongoingPos = this.getRealPosition(this.ongoingTouches.getTouch(event));

			this.ctx.moveTo(ongoingPos.x, ongoingPos.y);
			this.ctx.lineTo(pos.x, pos.y);

			this.ongoingTouches.deleteTouch(event.pointerId);
		};

		this.canvasElement.onpointercancel = event => {
			this.ongoingTouches.deleteTouch(event.pointerId);
		};

		this.canvasElement.onpointerleave = event => {
			this.ongoingTouches.deleteTouch(event.pointerId);
		}

		this.canvasElement.onpointerenter = event => {
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
		return this.isErasing || event.buttons === 32;
	}

	private getLineStyle = (): string => {
		// Increment through the colours of the rainbow and reset to the beginning when reaching the last colour
		const newIndex = (this.isRainbow)
			? (this.rainbowIndex < rainbow.length - 1)
				? 1
				: this.rainbowIndex * -1
			: this.rainbowIndex;

		return (this.isRainbow) ? rainbow[this.rainbowIndex += newIndex] : '#000000';
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
