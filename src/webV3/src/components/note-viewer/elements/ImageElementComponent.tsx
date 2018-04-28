import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { SyntheticEvent } from 'react';
import { dataURItoBlob } from '../../../util';
import { Row, Input, Col } from 'react-materialize';
import { NoteElement } from '../../../types/NotepadTypes';

export default class ImageElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets, elementEditing } = this.props;
		const isEditing = elementEditing === element.args.id;

		return (
			<div style={{overflow: 'hidden', height: element.args.height, minHeight: '130px'}} onClick={this.openEditor}>
				{!isEditing && <img style={{height: element.args.height, width: element.args.width }} src={noteAssets[element.args.ext!]} />}
				{
					isEditing &&
					<div style={{height: '100%'}}>
						<em>Upload a new image...</em><br />
						<input type="file" onChange={this.fileSelected} style={{padding: '5px'}} />

						<Row>
							<Col s={6}>
								<Input
									label="Width"
									defaultValue={element.args.width}
									onChange={(e, v) => this.onSizeEdit('width', v)}
								/>
							</Col>

							<Col s={6}>
								<Input
									label="Height"
									defaultValue={element.args.height}
									onChange={(e, v) => this.onSizeEdit('height', v)}
								/>
							</Col>
						</Row>
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

	private onSizeEdit = (type: 'width' | 'height', value: string) => {
		const { element, updateElement } = this.props;

		const newElement: NoteElement = {
			...element,
			args: {
				...element.args,
				[type]: value
			}
		};

		updateElement!(element.args.id, newElement);
	}
}
