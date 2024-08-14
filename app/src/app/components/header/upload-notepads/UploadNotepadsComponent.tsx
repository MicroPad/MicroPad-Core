import React, { SyntheticEvent } from 'react';
import { Icon } from 'react-materialize';
import JSZip from 'jszip';
import { readFileInputEventAsText } from '../../../util';
import NavItem2 from '../../NavItem';

export interface IUploadNotepadsComponentProps {
	parseNpx?: (xml: string) => void;
	parseEnex?: (enex: string) => void;
}

export default class UploadNotepadsComponent extends React.Component<IUploadNotepadsComponentProps> {
	private uploadInput: HTMLInputElement | null = null;

	render() {
		return (
			<NavItem2 href="#!" onClick={this.triggerUpload}>
				<Icon left={true}>file_upload</Icon> Import (npx/zip/enex)
				<input id="upload-notepad-input" ref={input => this.uploadInput = input} onChange={this.onUploadChanged} style={{ display: 'none' }} type="file" />
			</NavItem2>
		);
	}

	private triggerUpload = () => {
		this.uploadInput?.click();
	}

	private onUploadChanged = (event: SyntheticEvent<HTMLInputElement>) => {
		const { parseNpx, parseEnex } = this.props;
		const fileName = event.currentTarget.files![0].name;
		const ext = fileName.split('.').pop()!.toLowerCase();

		switch (ext) {
			case 'npx':
				readFileInputEventAsText(event)
					.then(xml => {
						parseNpx!(xml);
					});
				break;

			case 'npxz':
			case 'zip':
				this.readFileInputEventAsArrayBuffer(event)
					.then(arrayBuffer => {
						const zip = new JSZip();
						zip.loadAsync(arrayBuffer)
							.then(() => {
								for (const name in zip.files) {
									if (name.split('.').pop()!.toLowerCase() !== 'npx') continue;

									zip.file(name)!.async('text')
										.then(xml => parseNpx!(xml));
								}
							});
					});
				break;

			case 'enex':
				readFileInputEventAsText(event)
					.then(xml => {
						parseEnex!(xml);
					});
				break;

			default:
				break;
		}

		// Ensure we can re-upload the same file again
		if (this.uploadInput) {
			this.uploadInput.value = '';
		}
	}

	private readFileInputEventAsArrayBuffer(event: SyntheticEvent<HTMLInputElement>): Promise<ArrayBuffer> {
		return new Promise(resolve => {
			const file = event.currentTarget.files![0];
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result as ArrayBuffer);

			reader.readAsArrayBuffer(file);
		});
	}
}
