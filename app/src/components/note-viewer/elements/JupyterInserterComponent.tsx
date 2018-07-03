import * as React from 'react';
import { SyntheticEvent } from 'react';
import { Icon } from 'react-materialize';
import { readFileInputEventAsText } from '../../../util';
import { IElementArgs, NoteElement } from '../../../types/NotepadTypes';
import { Dialog } from '../../../dialogs';
import { Translators } from 'upad-parse/dist';

export interface IJupyterInserterComponentProps {
	insertElement: (element: NoteElement) => void;
}

export default class JupyterInserterComponent extends React.Component<IJupyterInserterComponentProps> {
	private uploadInput: HTMLInputElement;

	render() {
		return (
			<span>
				<a href="#!" onClick={() => this.uploadInput.click()}><Icon left={true}>description</Icon> Jupyter Notebook (.ipynb)</a>
				<input ref={input => this.uploadInput = input!} onChange={this.onUploadChanged} style={{ display: 'none' }} type="file" />
			</span>
		);
	}

	private onUploadChanged = (event: SyntheticEvent<HTMLInputElement>) => {
		const { insertElement } = this.props;

		readFileInputEventAsText(event).then(json => {
			insertElement({
				type: 'markdown',
				args: {} as IElementArgs,
				content: Translators.Json.toMarkdownFromJupyter(json)
			});
		}).catch(err => {
			console.error(err);
			Dialog.alert('Error parsing Jupyter Notebook');
		});
	}
}
