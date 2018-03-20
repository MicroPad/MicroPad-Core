import * as React from 'react';
import { NoteElement } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';
import MarkdownElementComponent from './markdown/MarkdownElementComponent';
import ImageElementComponent from './ImageElementComponent';
import FileElementComponent from './FileElementComponent';
import RecordingElement from './RecordingElementComponent';
import DrawingElementComponent from './drawing/DrawingElementComponent';

export interface INoteElementComponentProps {
	element: NoteElement;
	elementEditing: string;
	noteAssets: object;
	search?: (query: string) => void;
	downloadAsset?: (filename: string, uuid: string) => void;
}

export default class NoteElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets, search, downloadAsset, elementEditing } = this.props;

		const containerStyles = {
			left: element.args.x,
			top: element.args.y
		};

		const elementStyles = {
			width: element.args.width
		};

		let elementComponent: JSX.Element | undefined = undefined;
		switch (element.type) {
			case 'markdown':
				elementComponent = <MarkdownElementComponent element={element} elementEditing={elementEditing} noteAssets={noteAssets} search={search!} />;
				break;
				
			case 'image':
				elementComponent = <ImageElementComponent element={element} elementEditing={elementEditing} noteAssets={noteAssets} />;
				break;

			case 'file':
				elementComponent = <FileElementComponent element={element} elementEditing={elementEditing} noteAssets={noteAssets} downloadAsset={downloadAsset!} />;
				break;

			case 'recording':
				elementComponent = <RecordingElement element={element} elementEditing={elementEditing} noteAssets={noteAssets} downloadAsset={downloadAsset!} />;
				break;

			case 'drawing':
				elementComponent = <DrawingElementComponent element={element} elementEditing={elementEditing} noteAssets={noteAssets} />;
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
