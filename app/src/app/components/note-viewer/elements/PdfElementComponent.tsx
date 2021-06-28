import * as React from 'react';
import { SyntheticEvent } from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Col, Row, TextInput } from 'react-materialize';
import { Resizable } from 're-resizable';
import { dataURItoBlob } from '../../../util';
import { Dialog } from '../../../services/dialogs';
import * as PDFObject from 'pdfobject';
import { NoteElement } from 'upad-parse/dist/Note';
import './PdfElementComponent.css';

export default class PdfElementComponent extends React.Component<INoteElementComponentProps> {
	private viewerElementRef?: HTMLDivElement | null;
	private isEditing = false;

	render() {
		const { element, theme, elementEditing } = this.props;
		if (!theme) return null;

		this.isEditing = elementEditing === element.args.id;

		// The PDF.js viewer must have a fixed height so disallow auto and set to the minimum (500px)
		const elementHeight = element.args.height === 'auto' ? '500px' : (element.args.height ?? '500px');

		return (
			<div style={{
				overflow: 'hidden',
				height: (this.isEditing) ? element.args.height! : 'auto',
				width: (this.isEditing) ? element.args.width : 'auto',
				minHeight: '130px',
				backgroundColor: theme.background
			}} onClick={this.openEditor}>
				<Resizable
					style={{ overflow: 'hidden' }}
					size={{ width: element.args.width!, height: elementHeight }}
					minWidth={330}
					minHeight={500}
					lockAspectRatio={false}
					onResizeStop={(e, d, ref) => {
						this.onSizeEdit('width', ref.style.width!);
						this.onSizeEdit('height', ref.style.height!);
					}}>
					{
						!this.isEditing &&
						!!element.args.filename &&
						<div ref={ref => this.viewerElementRef = ref} />
					}

					{
						this.isEditing &&
						<div style={{ padding: '10px' }}>
							<em style={{ color: theme.text }}>Upload a new PDF...</em><br />
							<input type="file" onChange={this.fileSelected} style={{ color: theme.text }} />

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
				</Resizable>
			</div>
		);
	}

	componentDidMount(): void {
		this.embedPdf();
	}

	componentDidUpdate(prevProps: Readonly<INoteElementComponentProps>): void {
		const wasEditing = prevProps.elementEditing === this.props.element.args.id;
		const elementChanged = prevProps.element !== this.props.element || prevProps.noteAssets !== this.props.noteAssets;

		if (wasEditing || elementChanged) this.embedPdf();
	}

	private embedPdf = () => {
		const { element, noteAssets } = this.props;
		const asset = noteAssets[element.args.ext || ''];

		if (this.isEditing || !this.viewerElementRef || !asset) return;

		PDFObject.embed(asset, this.viewerElementRef, {
			fallbackLink: false,
			PDFJS_URL: './assets/pdfjs/web/viewer.html',
			forcePDFJS: !!window['isElectron']
		});
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
