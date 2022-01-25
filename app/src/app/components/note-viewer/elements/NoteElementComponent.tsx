import React from 'react';
import './NoteElementComponent.css';
import MarkdownElementComponent from './markdown/MarkdownElementContainer';
import ImageElementComponent from './ImageElementComponent';
import FileElementComponent from './FileElementComponent';
import RecordingElement from './RecordingElementComponent';
import DrawingElementComponent from './drawing/DrawingElementContainer';
import { INoteViewerComponentProps } from '../NoteViewerComponent';
import { Icon, Row } from 'react-materialize';
import Draggable, { DraggableData } from 'react-draggable';
import SourcesComponent from '../sources/SourcesContainer';
import { NoteElement } from 'upad-parse/dist/Note';
import { EditDueDateComponent } from './EditDueDateComponent';
import PdfElementComponent from './PdfElementComponent';
import { TOAST_HANDLER } from '../../../root';
import { ThemeValues } from '../../../ThemeValues';
import Button2 from '../../Button';

export interface INoteElementComponentProps extends Partial<INoteViewerComponentProps> {
	element: NoteElement;
	elementEditing: string;
	noteAssets: object;
	edit: (id: string) => void;
	deleteElement?: (id: string) => void;
	search?: (query: string) => void;
	insert?: (element: NoteElement) => void;
}

type State = {
	isDragging: boolean,
	preDragSize: {
		width: number,
		height: number
	}
};

export default class NoteElementComponent extends React.Component<INoteElementComponentProps, State> {
	private element!: HTMLDivElement;
	private container!: HTMLDivElement;
	private oldZIndex?: string | null;
	private isDragging = false;

	render() {
		const { element, noteAssets, theme, search, downloadAsset, elementEditing, edit, updateElement } = this.props;
		if (!theme) return null;

		const isEditing = element.args.id === elementEditing;

		const containerStyles = {
			zIndex: (isEditing) ? 5000 : 'auto' as 'auto'
		};

		const backgroundColour = theme.background === '#000' ? ThemeValues.Midnight.background : theme.background;
		const elementStyles = {
			width: (element.type !== 'image' && element.type !== 'markdown') ? element.args.width : 'auto',
			backgroundColor: (isEditing) ? backgroundColour : undefined,
			overflow: 'hidden'
		};

		let elementComponent: JSX.Element | undefined = undefined;
		switch (element.type) {
			case 'markdown':
				elementComponent = (
					<MarkdownElementComponent
					element={element}
					elementEditing={elementEditing}
					noteAssets={noteAssets}
					theme={theme}
					updateElement={updateElement}
					edit={edit}
					search={search!} />
				);
				break;

			case 'image':
				elementComponent = (
					<ImageElementComponent
					element={element}
					elementEditing={elementEditing}
					theme={theme}
					updateElement={updateElement}
					noteAssets={noteAssets}
					edit={edit} />
				);
				break;

			case 'pdf':
				elementComponent = (
					<PdfElementComponent
						element={element}
						theme={theme}
						elementEditing={elementEditing}
						updateElement={updateElement}
						noteAssets={noteAssets}
						edit={edit} />
				);
				break;

			case 'file':
				elementComponent = (
					<FileElementComponent
					element={element}
					theme={theme}
					elementEditing={elementEditing}
					updateElement={updateElement}
					noteAssets={noteAssets}
					edit={edit} />
				);
				break;

			case 'recording':
				elementComponent = (
					<RecordingElement
					element={element}
					theme={theme}
					elementEditing={elementEditing}
					updateElement={updateElement}
					noteAssets={noteAssets}
					edit={edit} />
				);
				break;

			case 'drawing':
				elementComponent = (
					<DrawingElementComponent
					element={element}
					theme={theme}
					elementEditing={elementEditing}
					updateElement={updateElement}
					noteAssets={noteAssets}
					edit={edit} />
				);
				break;

			default:
				break;
		}

		return (
			<Draggable
				onStart={() => {
					this.isDragging = true;
					if (navigator.vibrate) navigator.vibrate(100);
					if (!this.container) return;
					this.oldZIndex = this.container.style.zIndex;
					this.container.style.zIndex = '5000';

					if (element.type === 'markdown') {
						const mdEl = document.querySelector<HTMLIFrameElement>(`.noteElement[data-el-id=${element.args.id}] iframe`);
						if (mdEl) {
							const size = mdEl.getBoundingClientRect();
							const resizeBlock = document.createElement('div');
							resizeBlock.id = 'note-element__resize-block';
							resizeBlock.innerHTML = '<i class="material-icons" aria-label="moving element symbol">explore</i>';
							resizeBlock.style.width = `${size.width}px`;
							resizeBlock.style.height = `${size.height}px`;
							mdEl.insertAdjacentElement('beforebegin', resizeBlock);
							mdEl.style.display = 'none';
						}
					}
				}}
				bounds={{
					left: 0,
					top: 0,
					right: Number.MAX_SAFE_INTEGER,
					bottom: Number.MAX_SAFE_INTEGER
				}}
				onStop={(event, data) => {
					this.handleDrag(event, data);
					this.isDragging = false;
					if (this.container) this.container.style.zIndex = (!!this.oldZIndex) ? this.oldZIndex : 'auto';

					if (element.type === 'markdown') {
						document.getElementById('note-element__resize-block')?.remove();
						const mdEl = document.querySelector<HTMLIFrameElement>(`.noteElement[data-el-id=${element.args.id}] iframe`);
						if (mdEl) {
							mdEl.style.display = 'block';
						}
					}
				}}
				defaultPosition={{ x: parseInt(element.args.x, 10), y: parseInt(element.args.y, 10) }}
				handle=".handle">
				<div className="noteElement" style={containerStyles} ref={e => this.container = e!} data-el-id={element.args.id}>
					<div className="z-depth-2 hoverable" style={elementStyles} ref={e => this.element = e!} onClick={this.openEditor}>
						{!(isEditing && element.type === 'drawing') && <p className="handle" style={{ color: theme.text }}>::::</p>}
						{!!elementComponent && elementComponent}

						{
							!!elementComponent && isEditing &&
							<div>
								<span className="bib-container" style={{ color: theme.text }}>Keep track of your sources: <SourcesComponent /></span>
								<EditDueDateComponent element={element} theme={theme} updateElement={updateElement!} />

								<Row style={{ paddingLeft: '5px', paddingTop: '10px' }}>
									<Button2 className="red" waves="light" onClick={this.delete} style={{ marginRight: '5px' }}><Icon left={true}>delete_forever</Icon> Delete</Button2>
								</Row>

								<Row style={{ paddingLeft: '5px' }}>
									<Button2 className="btn-flat" waves="light" onClick={() => edit('')} style={{ marginRight: '5px', float: 'right' }}>Close editor (autosaved)</Button2>
								</Row>
							</div>
						}
					</div>
				</div>
			</Draggable>
		);
	}

	componentDidMount() {
		window.document.body.addEventListener('touchmove', this.stopScrollIfDragging, {
			passive: false
		});
	}

	componentWillUnmount() {
		window.document.body.removeEventListener('touchmove', this.stopScrollIfDragging);
	}

	private stopScrollIfDragging = (event: Event) => {
		if (this.isDragging) event.preventDefault();
	}

	private handleDrag = (_: any, data: DraggableData) => {
		const { element, updateElement } = this.props;
		if (data.x < 0) data.x = 0;
		if (data.y < 0) data.y = 0;

		updateElement!(element.args.id, {
			...element,
			args: {
				...element.args,
				x: data.x + 'px',
				y: data.y + 'px'
			}
		});
	}

	private delete = async () => {
		const { element, deleteElement, edit, insert } = this.props;
		if (!deleteElement || !edit || !insert) return;

		deleteElement(element.args.id);
		edit('');

		// Undo dialog
		const guid = TOAST_HANDLER.register(() => insert(element));
		M.toast({
			html: `Element Deleted <a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.toastEvent('${guid}');">UNDO</a>`,
			displayLength: 6000
		});
	}

	private openEditor = event => {
		const { element, edit } = this.props;
		if (event.target !== this.element) return;

		edit(element.args.id);
	}
}
