import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';

export default class MarkdownElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element } = this.props;

		return (
			<div style={{padding: '5px', height: element.args.height}}>{element.content}</div>
		);
	}
}
