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

	render() {
		const { element, noteAssets, search, downloadAsset, elementEditing, edit, updateElement } = this.props;
		const isEditing = element.args.id === elementEditing;

		const containerStyles = {
			zIndex: (isEditing) ? 5000 : undefined
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
					if (navigator.vibrate) navigator.vibrate(100);
				}}
				onStop={this.handleDrag}
				defaultPosition={{ x: parseInt(element.args.x, 10), y: parseInt(element.args.y, 10) }}
				handle=".handle">
				<div className="noteElement" style={containerStyles}>
					<div className="z-depth-2 hoverable" style={elementStyles} ref={e => this.element = e!} onClick={this.openEditor}>
						{!(isEditing && element.type === 'drawing') && <p className="handle">::::</p>}
						{!!elementComponent && elementComponent}

						{
							!!elementComponent && isEditing &&
							<div>
								<Row style={{paddingLeft: '5px'}}>
									<Button className="red" waves="light" onClick={this.delete} style={{marginRight: '5px'}}><Icon left={true}>delete_forever</Icon> Delete</Button>
									<span style={{marginRight: '5px'}}><SourcesComponent /></span>
								</Row>

								<Row style={{paddingLeft: '5px'}}>
									<Button className="btn-flat" waves="light" onClick={() => edit('')} style={{marginRight: '5px'}}>Close</Button>
								</Row>
							</div>
						}
					</div>
				</div>
			</Draggable>
		);
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

	private delete = () => {
		const { element, deleteElement, edit } = this.props;
		if (confirm('Are you sure you want to delete this element?')) {
			deleteElement!(element.args.id);
			edit!('');
		}
	}

	private openEditor = event => {
		const { element, edit } = this.props;
		if (event.target !== this.element) return;

		edit(element.args.id);
	}
}
