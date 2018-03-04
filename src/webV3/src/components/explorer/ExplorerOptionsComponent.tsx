import * as React from 'react';
import { INPXObject } from '../../types/NotepadTypes';
import { Button, Icon, Input, Modal, Row } from 'react-materialize';
import { APP_NAME, MICROPAD_URL } from '../../types';
import { Observable } from 'rxjs/Observable';
import { debounceTime, tap } from 'rxjs/operators';

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
				key={JSON.stringify({ ...objToEdit, title: '' })}
				header={`Options for ${objToEdit.title}`}
				trigger={<a href="#!" style={{color: 'white'}}><Icon tiny={true}>settings</Icon></a>}>
				<div id="explorer-options-modal">
					<Row><Input s={12} label="Title" value={objToEdit.title} onChange={this.onInput} /></Row>
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

	private onInput = (event, value: string) => {
		const { objToEdit, type, renameNotepad } = this.props;

		switch (type) {
			case 'notepad':
				Observable.of(value)
					.pipe(debounceTime(1000))
					.subscribe(title => renameNotepad!(title));
				break;

			default:
				break;
		}
	}

	private delete = () => {
		const { objToEdit, type, deleteNotepad } = this.props;
		if (!confirm(`Are you sure you want to delete '${objToEdit.title}'?`)) return;

		switch (type) {
			case 'notepad':
				document.getElementsByClassName('modal-overlay')[0].outerHTML = '';
				deleteNotepad!(objToEdit.title);
				break;

			default:
				break;
		}
	}
}
