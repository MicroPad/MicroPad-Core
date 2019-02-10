import * as React from 'react';
import { IRenameNotepadObjectAction } from '../../../core/types/NotepadTypes';
import { Button, Col, Icon, Input, Modal, Row } from 'react-materialize';
import { APP_NAME } from '../../../core/types';
import { Dialog } from 'src/react-web/dialogs';
import { Notepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import PathChangeComponent from '../../containers/PathChangeContainer';

export interface IExplorerOptionsComponentProps {
	objToEdit: NPXObject | Notepad;
	type: 'notepad' | 'section' | 'note';
	colour: string;
	deleteNotepad?: (title: string) => void;
	exportNotepad?: () => void;
	renameNotepad?: (newTitle: string) => void;
	deleteNotepadObject?: (internalId: string) => void;
	renameNotepadObject?: (params: IRenameNotepadObjectAction) => void;
	loadNote?: () => void;
	print?: () => void;
	encrypt?: (notepad: Notepad, passkey: string) => void;
}

export default class ExplorerOptionsComponent extends React.Component<IExplorerOptionsComponentProps> {
	private titleInput: Input;

	render() {
		const { objToEdit, type, colour, exportNotepad, loadNote, print } = this.props;

		const notepadOptions: JSX.Element = (
			<div>
				<Row>
					<Button className="blue" waves="light" onClick={exportNotepad}>
						<Icon left={true}>file_download</Icon> Export Notebook
					</Button>
				</Row>

				<Row>
					<p><strong>Experimental Options:</strong></p>

					<Button className="blue" waves="light" onClick={this.encrypt}>
						<Icon left={true}>enhanced_encryption</Icon> Encrypt Notebook
					</Button>

					{!!(objToEdit as Notepad).crypto && <p>
						This notebook is currently secured with {(objToEdit as Notepad).crypto}.
					</p>}

					<p>
						<em>Encrypting a notebook/notepad is irreversible. If you forget your passkey, it will be impossible to recover your notes.</em>
					</p>
				</Row>
			</div>
		);

		const noteOptions: JSX.Element = (
			<div>
				<Row><Button className="blue" waves="light" onClick={() => {
					if (!!loadNote) loadNote();
					this.closeModal();
					setTimeout(() => print!(), 500);
				}}>Export/Print Note (PDF)</Button></Row>
			</div>
		);

		return (
			<Modal
				key={`npeo-${objToEdit.title}`}
				header={`Options for ${objToEdit.title}`}
				trigger={<a href="#!" className="exp-options-trigger" style={{ color: colour }}><Icon tiny={true} className="exp-options-trigger">settings</Icon></a>}>
				<div id="explorer-options-modal">
					<Row>
						<Input ref={input => this.titleInput = input} s={6} label="Title" defaultValue={objToEdit.title}/>
						<Col s={6}><Button className="blue" waves="light" onClick={this.rename}>Rename {type}</Button></Col>
					</Row>
					<Row><Button className="red" waves="light" onClick={this.delete}><Icon
						left={true}>delete_forever</Icon> Delete {type}</Button></Row>
					{(type === 'notepad') && notepadOptions}
					{(type === 'note') && noteOptions}
					{
						(type === 'note' || type === 'section') &&
						<PathChangeComponent objToEdit={objToEdit as NPXObject} type={type} changed={() => this.closeModal()} />
					}
				</div>
			</Modal>
		);
	}

	private rename = () => {
		const { objToEdit, type, renameNotepad, renameNotepadObject } = this.props;
		const value = this.titleInput.state.value;

		document.getElementsByClassName('modal-overlay')[0].outerHTML = '';

		switch (type) {
			case 'notepad':
				renameNotepad!(value);
				break;

			case 'section':
			case 'note':
				renameNotepadObject!({ internalRef: (objToEdit as NPXObject).internalRef, newName: value });
				break;

			default:
				break;
		}
	}

	private delete = async () => {
		const { objToEdit, type, deleteNotepad, deleteNotepadObject } = this.props;
		if (!await Dialog.confirm(`Are you sure you want to delete '${objToEdit.title}'?`)) return;

		document.getElementsByClassName('modal-overlay')[0].outerHTML = '';

		switch (type) {
			case 'notepad':
				deleteNotepad!(objToEdit.title);
				break;

			case 'section':
			case 'note':
				deleteNotepadObject!((objToEdit as NPXObject).internalRef);
				break;

			default:
				break;
		}
	}

	private encrypt = async () => {
		const { objToEdit, encrypt } = this.props;
		const notepad = objToEdit as Notepad;

		if (!encrypt) return;

		if (!await Dialog.confirm(`Are you sure you want to encrypt '${notepad.title}'? This will secure all of your note's text contents and the structure of the notebook. Images and other binary assets are not encrypted.`)) return;

		const passkey = await Dialog.promptSecure('Passkey:');
		if (!passkey) return;

		if (await Dialog.promptSecure('Confirm Passkey:') !== passkey) {
			Dialog.alert('Your two passkeys did not match');
			return;
		}

		encrypt(notepad, passkey);
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
