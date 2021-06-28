import * as React from 'react';
import { SyntheticEvent } from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Button, Row } from 'react-materialize';
import { dataURItoBlob } from '../../../util';
import { Dialog } from '../../../services/dialogs';
import { ITheme } from '../../../types/Themes';

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

	private fileSelected = event => {
		const { updateElement, element, edit } = this.props;

		this.readFileInputEventAsDataUrl(event)
			.then(([dataUri, filename]: [string, string]) => {
				updateElement!(element.args.id, {
					...element,
					args: {
						...element.args,
						filename: filename,
					}
				}, dataURItoBlob(dataUri));
				edit('');
			})
			.catch((err) => {
				Dialog.alert('Error uploading file');
				console.error(err);
			});
	}

	private readFileInputEventAsDataUrl(event: SyntheticEvent<HTMLInputElement>): Promise<[string, string]> {
		return new Promise((resolve, reject) => {
			const file = event.currentTarget.files![0];
			if (!file) reject();
			const reader = new FileReader();

			reader.onload = () => resolve([reader.result as string, file.name as string]);

			reader.readAsDataURL(file);
		});
	}

	private openEditor = event => {
		const { element, edit } = this.props;

		let path = event.path || (event.composedPath && event.composedPath()) || [event.target];
		if (path[0].tagName.toLowerCase() === 'button') return;

		edit(element.args.id);
	}
}
