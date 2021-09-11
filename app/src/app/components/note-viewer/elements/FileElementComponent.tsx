import React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Button, Row } from 'react-materialize';
import { Dialog } from '../../../services/dialogs';
import { ITheme } from '../../../types/Themes';
import { readFile } from '../../../services/files';

export interface IFileElementComponent extends INoteElementComponentProps {
	downloadAsset: (filename: string, uuid: string) => void;
	theme: ITheme;
}

export default class FileElementComponent extends React.Component<IFileElementComponent> {
	render() {
		const { element, downloadAsset, theme, elementEditing } = this.props;
		const isEditing = elementEditing === element.args.id;

		return (
			<div style={{ padding: '5px', width: 'max-content' }} onClick={this.openEditor}>
				<em style={{ color: theme.text }}>
					{!isEditing && element.args.filename}
					{(isEditing || !element.args.filename) && `Upload a file...`}
				</em>

				<Row>
					{
						!isEditing &&
						!!element.args.filename &&
						<Button className="accent-btn" waves="light" onClick={() => downloadAsset(element.args.filename!, element.args.ext!)}>
							Download File
						</Button>
					}

					{
						isEditing &&
						<input type="file" onChange={this.fileSelected} style={{ color: theme.text }} />
					}
				</Row>
			</div>
		);
	}

	private fileSelected = async event => {
		const { updateElement, element, edit } = this.props;

		try {
			const file = await readFile(event);
			updateElement!(element.args.id, {
				...element,
				args: {
					...element.args,
					filename: file.name,
				}
			}, file);
			edit('');
		} catch (err) {
			console.error(err);
			await Dialog.alert('There was an error storing your file');
		}
	}

	private openEditor = event => {
		const { element, edit } = this.props;

		let path = event.path || (event.composedPath && event.composedPath()) || [event.target];
		if (path[0].tagName.toLowerCase() === 'button') return;

		edit(element.args.id);
	}
}
