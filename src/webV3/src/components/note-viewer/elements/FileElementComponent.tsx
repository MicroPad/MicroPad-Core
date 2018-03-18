import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Button, Row } from 'react-materialize';

export interface IFileElementComponent extends INoteElementComponentProps {
	downloadAsset: (filename: string, uuid: string) => void;
}

export default class FileElementComponent extends React.Component<IFileElementComponent> {
	render() {
		const { element, noteAssets, downloadAsset } = this.props;

		return (
			<div style={{padding: '5px', width: 'max-content'}}>
				<em>{element.args.filename}</em>
				<Row>
					<Button className="blue" waves="light" onClick={() => downloadAsset(element.args.filename!, element.args.ext!)}>
						Download/Open File
					</Button>
				</Row>
			</div>
		);
	}
}
