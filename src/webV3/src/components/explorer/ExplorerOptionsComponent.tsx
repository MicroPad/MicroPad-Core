import * as React from 'react';
import { INote, INPXObject, ISection } from '../../types/NotepadTypes';
import { Button, Col, Icon, Input, Modal, Row } from 'react-materialize';
import { APP_NAME, MICROPAD_URL } from '../../types';

export interface IExplorerOptionsComponentProps {
	objToEdit: INPXObject;
	type: 'notepad' | 'section' | 'note';
	deleteNotepad?: (title: string) => void;
	exportNotepad?: () => void;
	renameNotepad?: (newTitle: string) => void;
	deleteNotepadObject?: (internalId: string) => void;
	renameNotepadObject?: (internalId: string) => void;
}

export default class ExplorerOptionsComponent extends React.Component<IExplorerOptionsComponentProps> {
	private titleInput: Input;

	render() {
		const { objToEdit, type, exportNotepad } = this.props;

		const notepadOptions: JSX.Element = (
			<div>
				<Row><Button className="blue" waves="light" onClick={exportNotepad}><Icon left={true}>file_download</Icon> Export Notepad</Button></Row>
			</div>
		);

		const noteOptions: JSX.Element = (
			<div>
				<Row><Button className="blue" waves="light">Export/Print Note (PDF)</Button></Row>
			</div>
		);

		return (
			<Modal
				key={`npeo-${objToEdit.title}`}
				header={`Options for ${objToEdit.title}`}
				trigger={<a href="#!" style={{color: 'white'}}><Icon tiny={true}>settings</Icon></a>}>
				<div id="explorer-options-modal">
					<Row>
						<Input ref={input => this.titleInput = input} s={6} label="Title" defaultValue={objToEdit.title} />
						<Col s={6}><Button waves="light" onClick={this.rename}>Rename {type}</Button></Col>
					</Row>
					<Row><Button className="red" waves="light" onClick={this.delete}><Icon left={true}>delete_forever</Icon> Delete {type}</Button></Row>
					{(type === 'notepad') && notepadOptions}
					{(type === 'note') && noteOptions}
					{
						(type === 'note' || type === 'section') &&
						<p>
							Changing the path of a {type} isn't supported in the new {APP_NAME}.<br />
							If you want to do that, you can import your notepad
							into <a href={`${MICROPAD_URL}/web`}>{APP_NAME} classic</a> and change the path there.
						</p>
					}
				</div>
			</Modal>
		);
	}

	private rename = () => {
		const { type, renameNotepad } = this.props;
		const value = this.titleInput.state.value;

		document.getElementsByClassName('modal-overlay')[0].outerHTML = '';

		switch (type) {
			case 'notepad':
				renameNotepad!(value);
				break;

			default:
				break;
		}
	}

	private delete = () => {
		const { objToEdit, type, deleteNotepad, deleteNotepadObject } = this.props;
		if (!confirm(`Are you sure you want to delete '${objToEdit.title}'?`)) return;

		document.getElementsByClassName('modal-overlay')[0].outerHTML = '';

		switch (type) {
			case 'notepad':
				deleteNotepad!(objToEdit.title);
				break;

			case 'section':
			case 'note':
				deleteNotepadObject!((objToEdit as INote | ISection).internalRef);
				break;

			default:
				break;
		}
	}
}
