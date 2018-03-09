import * as React from 'react';
import { NoteElement } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';
import MarkdownElementComponent from './MarkdownElementComponent';
import ImageElementComponent from './ImageElementComponent';

export interface INoteElementComponentProps {
	element: NoteElement;
	noteAssets: object;
}

export default class NoteElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets } = this.props;

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
				elementComponent = <MarkdownElementComponent element={element} noteAssets={noteAssets} />;
				break;
				
			case 'image':
				elementComponent = <ImageElementComponent element={element} noteAssets={noteAssets} />;
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
