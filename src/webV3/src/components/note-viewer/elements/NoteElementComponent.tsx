import * as React from 'react';
import { Element } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';

export interface INoteElement {
	element: Element;
}

export default class NoteElementComponent extends React.Component<INoteElement> {
	render() {
		const { element } = this.props;

		const styles = {
			left: element.args.x,
			top: element.args.y,
			width: element.args.width,
			height: element.args.height
		};

		return (
			<div className="noteElement" style={styles}>
				<p>{element.content}</p>
			</div>
		);
	}
}
