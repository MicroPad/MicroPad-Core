import React, { useState } from 'react';
import { Button, Col, Icon, Row, TextInput } from 'react-materialize';
import { Notepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import PathChangeComponent from '../path-change/PathChangeContainer';
import { ConnectedProps } from 'react-redux';
import { explorerOptionsConnector } from './ExplorerOptionsContainer';
import MoveComponent from '../move/MoveContainer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';

export type ExplorerOptionsProps = {
	objToEdit: NPXObject | Notepad;
	type: 'notepad' | 'section' | 'note';
};

const ExplorerOptionsComponent = (props: ConnectedProps<typeof explorerOptionsConnector> & ExplorerOptionsProps) => {
	const [titleView, setTitleView] = useState(props.objToEdit.title);

	const displayType = props.type === 'notepad' ? 'notebook' : props.type;

	const notepadOptions: JSX.Element = (
		<div>
			<Row>
				<Button className="accent-btn" waves="light" onClick={props.exportNotepad}>
					<Icon left={true}>file_download</Icon> Export Notebook
				</Button>
			</Row>

			<Row>
				<Button className="accent-btn" waves="light" onClick={() => props.encrypt()}>
					<Icon left={true}>enhanced_encryption</Icon> Encrypt Notebook
				</Button>

				{!!(props.objToEdit as Notepad).crypto && <p>
					This notebook is currently secured with {(props.objToEdit as Notepad).crypto}.
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
				props.loadNote((props.objToEdit as NPXObject).internalRef);
				setTimeout(() => props.print(), 500);
			}}>Export/Print Note (PDF)</Button></Row>
		</div>
	);

	const modalId = `notepad-edit-object-modal-${(props.objToEdit as NPXObject).internalRef ?? `np-title-${props.objToEdit.title}`}`

	return (
		<SingletonModalComponent
			id={modalId}
			key={modalId}
			header={`Options for ${props.objToEdit.title}`}
			trigger={<a href="#!" className="exp-options-trigger" style={{ color: props.colour }}><Icon tiny={true} className="exp-options-trigger">settings</Icon></a>}
			options={DEFAULT_MODAL_OPTIONS}>
			<div className="explorer-options-modal">
				<Row>
					<form action="#!" onSubmit={e => {
						e.preventDefault();
						props.rename(titleView);
						return false;
					}}>
						<TextInput s={8} label="Title" value={titleView} onChange={e => setTitleView(e.target.value)} />
						<Col s={4}><Button className="accent-btn" waves="light">Rename {displayType}</Button></Col>
					</form>
				</Row>
				<Row><Button className="red" waves="light" onClick={() => props.deleteObj()}><Icon
					left={true}>delete_forever</Icon> Delete {displayType}</Button></Row>
				{(props.type === 'notepad') && notepadOptions}
				{(props.type === 'note') && noteOptions}
				{
					(props.type === 'note' || props.type === 'section') &&
					<React.Fragment>
						<PathChangeComponent objToEdit={props.objToEdit as NPXObject} type={props.type} />
						<br />
						<MoveComponent internalRef={(props.objToEdit as NPXObject).internalRef} type={props.type} />
					</React.Fragment>
				}
			</div>
		</SingletonModalComponent>
	);
};
export default ExplorerOptionsComponent;
