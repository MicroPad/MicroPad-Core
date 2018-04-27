import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { SyntheticEvent } from 'react';
import { dataURItoBlob } from '../../../util';

export default class ImageElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets, elementEditing } = this.props;
		const isEditing = elementEditing === element.args.id;

		return (
			<div style={{overflow: 'hidden', height: element.args.height}} onClick={this.openEditor}>
				{!isEditing && <img style={{height: element.args.height, width: element.args.width }} src={noteAssets[element.args.ext!]} />}
				{
					isEditing &&
					<div>
						<em>Upload a new image...</em><br />
						<input type="file" onChange={this.fileSelected} style={{padding: '5px'}} />
					</div>
				}
			</div>
		);
	}

	private fileSelected = event => {
		const { updateElement, element, edit } = this.props;

		this.readFileInputEventAsDataUrl(event)
			.then(dataUri => {
				updateElement!(element.args.id, element, dataURItoBlob(dataUri));
				edit('');
			})
			.catch((err) => {
				alert('Error uploading file');
				console.error(err);
			});
	}

	private readFileInputEventAsDataUrl(event: SyntheticEvent<HTMLInputElement>): Promise<string> {
		return new Promise((resolve, reject) => {
			const file = event.currentTarget.files![0];
			if (!file) reject();
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result);

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
