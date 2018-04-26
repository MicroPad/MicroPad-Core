import * as React from 'react';
import { NoteElement } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';
import MarkdownElementComponent from './markdown/MarkdownElementComponent';
import ImageElementComponent from './ImageElementComponent';
import FileElementComponent from './FileElementComponent';
import RecordingElement from './RecordingElementComponent';
import DrawingElementComponent from './drawing/DrawingElementComponent';
import { INoteViewerComponentProps } from '../NoteViewerComponent';

export interface INoteElementComponentProps extends Partial<INoteViewerComponentProps> {
	element: NoteElement;
	elementEditing: string;
	noteAssets: object;
	edit: (id: string) => void;
	search?: (query: string) => void;
	downloadAsset?: (filename: string, uuid: string) => void;
}

export default class NoteElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets, search, downloadAsset, elementEditing, edit, updateElement } = this.props;

		const containerStyles = {
			left: element.args.x,
			top: element.args.y,
			zIndex: (element.args.id === elementEditing) ? 5000 : undefined
		};

		const elementStyles = {
			width: element.args.width,
			backgroundColor: (element.args.id === elementEditing) ? 'white' : undefined
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
			<div className="noteElement" style={containerStyles}>
				<div className="z-depth-2 hoverable" style={elementStyles}>
					<p className="handle">::::</p>
					{!!elementComponent && elementComponent}
				</div>
			</div>
		);
	}
}
