import React, { SyntheticEvent } from 'react';
import { Icon, NavItem } from 'react-materialize';
import { Translators } from 'upad-parse/dist';

export interface IImportMarkdownComponentProps {
	importMd?: (md: Translators.Markdown.MarkdownImport[]) => void;
}

export default class ImportMarkdownComponent extends React.Component<IImportMarkdownComponentProps> {
	private uploadInput!: HTMLInputElement;

	render() {
		return (
			<NavItem href="#!" onClick={this.triggerUpload}>
				<Icon left={true}>insert_drive_file</Icon> Import Markdown Files
				<input id="upload-notepad-input" ref={input => this.uploadInput = input!} onChange={this.onUploadChanged} style={{ display: 'none' }} type="file" multiple={true} />
			</NavItem>
		);
	}

	private triggerUpload = () => {
		this.uploadInput.click();
	}

	private onUploadChanged = async (event: SyntheticEvent<HTMLInputElement>) => {
		const { importMd } = this.props;

		const files = event.currentTarget.files;
		if (!files || !importMd) return;

		const imports = await Promise.all(
			Array.from(files)
				.filter(file => file.name.endsWith('.md'))
				.map(async file => ({
					title: file.name.split('.')[0],
					content: await this.readFileAsText(file)
				}))
		);

		importMd(imports);

		// Ensure we can re-upload the same file again
		this.uploadInput.value = '';
	}

	private readFileAsText(file: File): Promise<string> {
		return new Promise(resolve => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);

			reader.readAsText(file);
		});
	}
}
