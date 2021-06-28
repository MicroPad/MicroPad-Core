import * as React from 'react';
import { FormEvent } from 'react';
import { Button, Col, Icon, Modal, Row, TextInput } from 'react-materialize';
import { Notepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import PathChangeComponent from '../path-change/PathChangeContainer';
import { Dialog } from '../../../services/dialogs';
import { ConnectedProps } from 'react-redux';
import { explorerOptionsConnector } from './ExplorerOptionsContainer';
import MoveComponent from '../move/MoveContainer';
import { DEFAULT_MODAL_OPTIONS, generateGuid } from '../../../util';

type Props = ConnectedProps<typeof explorerOptionsConnector> & {
	objToEdit: NPXObject | Notepad;
	type: 'notepad' | 'section' | 'note';
};

export default class ExplorerOptionsComponent extends React.Component<Props> {
	private title: string;

	constructor(props: Props) {
		super(props);
		this.title = props.objToEdit.title;
	}

	render() {
		const { objToEdit, type, colour, exportNotepad, loadNote, print } = this.props;

		const displayType = type === 'notepad' ? 'notebook' : type;

		const notepadOptions: JSX.Element = (
			<div>
				<Row>
					<Button className="accent-btn" waves="light" onClick={exportNotepad}>
						<Icon left={true}>file_download</Icon> Export Notebook
					</Button>
				</Row>

				<Row>
					<Button className="accent-btn" waves="light" onClick={this.encrypt}>
						<Icon left={true}>enhanced_encryption</Icon> Encrypt Notebook
					</Button>

					{!!(objToEdit as Notepad).crypto && <p>
						This notebook is currently secured with {(objToEdit as Notepad).crypto}.
					</p>}

					<p>
						<em>
							Encrypting a notebook/notepad is irreversible. If you forget your passkey, it will be impossible to recover your notes.
							Only titles, sources, markdown text, etc. are encrypted. Images and other binary items will not be encrypted. Exporting
							to NPX files will export to plain-text.
						</em>
					</p>
				</Row>
			</div>
		);

		const noteOptions: JSX.Element = (
			<div>
				<Row><Button className="accent-btn" waves="light" onClick={() => {
					if (!!loadNote) loadNote((objToEdit as NPXObject).internalRef);
					this.closeModal();
					setTimeout(() => print!(), 500);
				}}>Export/Print Note (PDF)</Button></Row>
			</div>
		);

		const modalId = `notepad-edit-object-modal-${(objToEdit as NPXObject).internalRef ?? generateGuid()}`

		return (
			<Modal
				id={modalId}
				key={modalId}
				header={`Options for ${objToEdit.title}`}
				trigger={<a href="#!" className="exp-options-trigger" style={{ color: colour }}><Icon tiny={true} className="exp-options-trigger">settings</Icon></a>}
				options={DEFAULT_MODAL_OPTIONS}>
				<div className="explorer-options-modal">
					<Row>
						<form action="#!" onSubmit={this.rename}>
							<TextInput s={8} label="Title" defaultValue={this.title} onChange={e => this.title = e.target.value} />
							<Col s={4}><Button className="accent-btn" waves="light">Rename {displayType}</Button></Col>
						</form>
					</Row>
					<Row><Button className="red" waves="light" onClick={this.delete}><Icon
						left={true}>delete_forever</Icon> Delete {displayType}</Button></Row>
					{(type === 'notepad') && notepadOptions}
					{(type === 'note') && noteOptions}
					{
						(type === 'note' || type === 'section') &&
							<React.Fragment>
								<PathChangeComponent objToEdit={objToEdit as NPXObject} type={type} changed={() => this.closeModal()} />
								<br />
								<MoveComponent internalRef={(objToEdit as NPXObject).internalRef} type={type} changed={() => this.closeModal()} />
							</React.Fragment>
					}
				</div>
			</Modal>
		);
	}

	private rename = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const { objToEdit, type, renameNotepad, renameNotepadObject } = this.props;

		document.querySelector<HTMLDivElement>('.modal-overlay')?.click();

		switch (type) {
			case 'notepad':
				renameNotepad!(this.title);
				break;

			case 'section':
			case 'note':
				renameNotepadObject!({ internalRef: (objToEdit as NPXObject).internalRef, newName: this.title });
				break;

			default:
				break;
		}

		return false;
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
