import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';

export default class RecordingElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets } = this.props;

		return (
			<div style={{padding: '5px', width: 'max-content'}}>
				<p><em>{element.args.filename}</em></p>
				<audio controls={true} src={noteAssets[element.args.ext!]} />
			</div>
		);
	}
}
