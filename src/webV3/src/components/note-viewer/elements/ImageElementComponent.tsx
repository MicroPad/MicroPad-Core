import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';

export default class ImageElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets } = this.props;

		return (
			<div style={{overflow: 'hidden', height: element.args.height}}>
				<img style={{height: element.args.height, width: element.args.width }} src={noteAssets[element.args.ext!]} />
			</div>
		);
	}
}
