import * as React from 'react';
import { NoteElement } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';
import MarkdownElementComponent from './markdown/MarkdownElementComponent';
import ImageElementComponent from './ImageElementComponent';
import FileElementComponent from './FileElementComponent';
import RecordingElement from './RecordingElementComponent';
import DrawingElementComponent from './drawing/DrawingElementComponent';
import { INoteViewerComponentProps } from '../NoteViewerComponent';
import { Button, Icon, Row } from 'react-materialize';
import Draggable, { DraggableData } from 'react-draggable';
import SourcesComponent from '../../../containers/SourcesContainer';
import { Dialog } from '../../../dialogs';

export interface INoteElementComponentProps extends Partial<INoteViewerComponentProps> {
	element: NoteElement;
	elementEditing: string;
	noteAssets: object;
	edit: (id: string) => void;
	deleteElement?: (id: string) => void;
	search?: (query: string) => void;
	downloadAsset?: (filename: string, uuid: string) => void;
}

export default class NoteElementComponent extends React.Component<INoteElementComponentProps> {
	private element: HTMLDivElement;
	private container: HTMLDivElement;
	private oldZIndex: string | null;
	private isDragging = false;

	render() {
		const { element, noteAssets, search, downloadAsset, elementEditing, edit, updateElement } = this.props;
		const isEditing = element.args.id === elementEditing;

		const containerStyles = {
			zIndex: (isEditing) ? 5000 : 'auto' as 'auto'
		};

		const elementStyles = {
			width: (element.type !== 'image' && element.type !== 'markdown') ? element.args.width : 'auto',
			backgroundColor: (isEditing) ? 'white' : undefined
		};

		let elementComponent: JSX.Element | undefined = undefined;
		switch (element.type) {
			case 'markdown':
				elementComponent = (
					<MarkdownElementComponent
					element={element}
					elementEditing={elementEditing}
					noteAssets={noteAssets}
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
					updateElement={updateElement}
					noteAssets={noteAssets}
					edit={edit} />
				);
				break;

			case 'file':
				elementComponent = (
					<FileElementComponent
					element={element}
					elementEditing={elementEditing}
					updateElement={updateElement}
					noteAssets={noteAssets}
					downloadAsset={downloadAsset!}
					edit={edit} />
				);
				break;

			case 'recording':
				elementComponent = (
					<RecordingElement
					element={element}
					elementEditing={elementEditing}
					updateElement={updateElement}
					noteAssets={noteAssets}
					downloadAsset={downloadAsset!}
					edit={edit} />
				);
				break;

			case 'drawing':
				elementComponent = (
					<DrawingElementComponent
					element={element}
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
				}}
				onStop={(event, data) => {
					this.handleDrag(event, data);
					this.isDragging = false;
					if (this.container) this.container.style.zIndex = (!!this.oldZIndex) ? this.oldZIndex : 'auto';
				}}
				defaultPosition={{ x: parseInt(element.args.x, 10), y: parseInt(element.args.y, 10) }}
				handle=".handle">
				<div className="noteElement" style={containerStyles} ref={e => this.container = e!}>
					<div className="z-depth-2 hoverable" style={elementStyles} ref={e => this.element = e!} onClick={this.openEditor}>
						{!(isEditing && element.type === 'drawing') && <p className="handle">::::</p>}
						{!!elementComponent && elementComponent}

						{
							!!elementComponent && isEditing &&
							<div>
								<Row style={{paddingLeft: '5px'}}>
									<Button className="red" waves="light" onClick={this.delete} style={{marginRight: '5px'}}><Icon left={true}>delete_forever</Icon> Delete</Button>
									<span className="bib-container" style={{marginRight: '5px'}}><SourcesComponent /></span>
								</Row>

								<Row style={{paddingLeft: '5px'}}>
									<Button className="btn-flat" waves="light" onClick={() => edit('')} style={{marginRight: '5px', float: 'right'}}>Close</Button>
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

	private handleDrag = (event: Event, data: DraggableData) => {
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
		const { element, deleteElement, edit } = this.props;
		if (!await Dialog.confirm('Are you sure you want to delete this element?')) return;

		deleteElement!(element.args.id);
		edit!('');
	}

	private openEditor = event => {
		const { element, edit } = this.props;
		if (event.target !== this.element) return;

		edit(element.args.id);
	}
}
