import React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Row } from 'react-materialize';
import { Dialog } from '../../../services/dialogs';
import { ITheme } from '../../../types/Themes';
import { readFile } from '../../../services/files';
import Button2 from '../../Button';

export interface IFileElementComponent extends INoteElementComponentProps {
	theme: ITheme;
}

export default class FileElementComponent extends React.Component<IFileElementComponent> {
	render() {
		const { element, theme, elementEditing, noteAssets } = this.props;
		const isEditing = elementEditing === element.args.id;
		const hasAsset = !!element.args.filename && !!element.args.ext && !!noteAssets[element.args.ext];

		return (
			<div style={{ padding: '5px', width: 'max-content' }} onClick={this.openEditor}>
				<em style={{ color: theme.text }}>
					{isEditing && `Upload a file...`}
					{!isEditing && !hasAsset && `Tap here to upload a file…`}
				</em>

				<Row>
					{
						!isEditing
						&& hasAsset
						&& <a href={noteAssets[element.args.ext!]} download={element.args.filename} onClick={e => e.stopPropagation()}>
							{element.args.filename}
						</a>
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
