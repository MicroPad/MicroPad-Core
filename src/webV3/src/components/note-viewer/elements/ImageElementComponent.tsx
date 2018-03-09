import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';

export default class ImageElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets } = this.props;

		return (
			<div style={{height: element.args.height, overflow: 'hidden'}}><img src={noteAssets[element.args.ext!]} /></div>
		);
	}
}
