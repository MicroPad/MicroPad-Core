import * as React from 'react';
import { INote, INPXObject, IRenameNotepadObjectAction, ISection } from '../../types/NotepadTypes';
import { Button, Col, Icon, Input, Modal, Row } from 'react-materialize';
import { APP_NAME, MICROPAD_URL } from '../../types';
import { Dialog } from 'src/dialogs';

export interface IExplorerOptionsComponentProps {
	objToEdit: INPXObject;
	type: 'notepad' | 'section' | 'note';
	deleteNotepad?: (title: string) => void;
	exportNotepad?: () => void;
	renameNotepad?: (newTitle: string) => void;
	deleteNotepadObject?: (internalId: string) => void;
	renameNotepadObject?: (params: IRenameNotepadObjectAction) => void;
	loadNote?: () => void;
	print?: () => void;
}

export default class ExplorerOptionsComponent extends React.Component<IExplorerOptionsComponentProps> {
	private titleInput: Input;

	render() {
		const { objToEdit, type, exportNotepad, loadNote, print } = this.props;

		const notepadOptions: JSX.Element = (
			<div>
				<Row><Button className="blue" waves="light" onClick={exportNotepad}><Icon
					left={true}>file_download</Icon> Export Notepad</Button></Row>
			</div>
		);

		const noteOptions: JSX.Element = (
			<div>
				<Row><Button className="blue" waves="light" onClick={() => {
					if (!!loadNote) loadNote();
					this.closeModal();
					setTimeout(() => print!(), 500);
				}}>Export/Print Note (PDF)</Button></Row>
				<p>If you want to generate a nice PDF using {APP_NAME}-markdown, try out <a target="_blank" rel="nofollow noreferrer" href="https://github.com/NickGeek/abstract">Abstract</a>.</p>
			</div>
		);

		return (
			<Modal
				key={`npeo-${objToEdit.title}`}
				header={`Options for ${objToEdit.title}`}
				trigger={<a href="#!" className="exp-options-trigger" style={{ color: 'white' }}><Icon tiny={true} className="exp-options-trigger">settings</Icon></a>}>
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
						<p>
							Changing the path of a {type} isn't supported in the new {APP_NAME}.<br/>
							If you want to do that, you can import your notepad
							into <a target="_blank" href={`${MICROPAD_URL}/web`}>{APP_NAME} classic</a> and change the path there.
						</p>
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
				renameNotepadObject!({ internalRef: (objToEdit as INote | ISection).internalRef, newName: value });
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
				deleteNotepadObject!((objToEdit as INote | ISection).internalRef);
				break;

			default:
				break;
		}
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
