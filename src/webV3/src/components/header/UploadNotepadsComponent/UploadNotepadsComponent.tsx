import * as React from 'react';
// @ts-ignore
import { Icon, NavItem } from 'react-materialize';
import { SyntheticEvent } from 'react';

export interface IUploadNotepadsComponentProps {
	parseNpx?: (xml: string) => void;
}

export default class UploadNotepadsComponent extends React.Component<IUploadNotepadsComponentProps> {
	private uploadInput: HTMLInputElement;

	render() {
		return (
			<NavItem href="#!" onClick={this.triggerUpload}>
				<Icon left={true}>file_upload</Icon> Upload
				<input ref={input => this.uploadInput = input!} onChange={this.onUploadChanged} style={{ display: 'none' }} type="file" />
			</NavItem>
		);
	}

	private triggerUpload = () => {
		this.uploadInput.click();
	}

	private onUploadChanged = (event) => {
		this.readFileInputEventAsText(event)
			.then(xml => {
				const { parseNpx } = this.props;
				parseNpx!(xml);
			});

		// Ensure we can re-upload the same file again
		this.uploadInput.value = '';
	}

	private readFileInputEventAsText(event: SyntheticEvent<HTMLInputElement>): Promise<string> {
		return new Promise(resolve => {
			const file = event.currentTarget.files![0];
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result);

			reader.readAsText(file);
		});
	}
}
