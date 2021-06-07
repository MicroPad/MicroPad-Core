import * as React from 'react';
import { SyntheticEvent } from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { dataURItoBlob } from '../../../util';
import { Col, Row, TextInput } from 'react-materialize';
import { Resizable } from 're-resizable';
import { Dialog } from '../../../services/dialogs';
import { NoteElement } from 'upad-parse/dist/Note';

export default class ImageElementComponent extends React.Component<INoteElementComponentProps> {
	render() {
		const { element, noteAssets, elementEditing, theme } = this.props;
		if (!theme) return null;

		const isEditing = elementEditing === element.args.id;

		return (
			<div style={{ overflow: 'hidden', height: (isEditing) ? element.args.height! : 'auto', width: (isEditing) ? element.args.width : 'auto', minHeight: '130px' }} onClick={this.openEditor}>
				{
					!isEditing &&
					<Resizable
						style={{ overflow: 'hidden' }}
						size={{ width: element.args.width!, height: element.args.height! }}
						minWidth={170}
						minHeight={130}
						lockAspectRatio={true}
						onResizeStop={(e, d, ref) => {
							this.onSizeEdit('width', ref.style.width!);
							this.onSizeEdit('height', ref.style.height!);
						}}>
						<img style={{ height: (element.args.height !== 'auto') ? '100%' : undefined, width: (element.args.width !== 'auto') ? '100%' : undefined }} src={noteAssets[element.args.ext!]} alt="" />
					</Resizable>
				}
				{
					isEditing &&
					<div style={{ height: '100%' }}>
						<em style={{ color: theme.text }}>Upload a new image...</em><br />
						<input type="file" onChange={this.fileSelected} style={{ padding: '5px', color: theme.text }} />

						<Row>
							<Col s={6}>
								<TextInput
									label="Width"
									defaultValue={element.args.width}
									onChange={e => this.onSizeEdit('width', e.target.value)}
									// style={{ color: theme.text }} TODO
								/>
							</Col>

							<Col s={6}>
								<TextInput
									label="Height"
									defaultValue={element.args.height}
									onChange={e => this.onSizeEdit('height', e.target.value)}
									// style={{ color: theme.text }} TODO
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
				Dialog.alert('Error uploading file');
				console.error(err);
			});
	}

	private readFileInputEventAsDataUrl(event: SyntheticEvent<HTMLInputElement>): Promise<string> {
		return new Promise((resolve, reject) => {
			const file = event.currentTarget.files![0];
			if (!file) reject();
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result as string);

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
