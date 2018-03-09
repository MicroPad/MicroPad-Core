import * as React from 'react';
import { Element } from '../../../types/NotepadTypes';
import './NoteElementComponent.css';

export interface INoteElement {
	element: Element;
}

export default class NoteElementComponent extends React.Component<INoteElement> {
	render() {
		const { element } = this.props;

		return (
			<div className="noteElement">
				<p>{element.content}</p>
			</div>
		);
	}
}
