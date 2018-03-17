import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Row, Button } from 'react-materialize';

export default class FileElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets } = this.props;

		return (
			<div style={{padding: '5px', width: 'max-content'}}>
				<em>{element.args.filename}</em>
				<Row>
					<Button className="blue" waves="light" onClick={() => this.downloadFile(noteAssets[element.args.ext!])}>
						Download/Open File
					</Button>
				</Row>
			</div>
		);
	}

	private downloadFile = (assetUrl: string) => {
		const newWindow = window.open(assetUrl, '_blank');
		newWindow!.opener = null;
		newWindow!.focus();
	}
}
