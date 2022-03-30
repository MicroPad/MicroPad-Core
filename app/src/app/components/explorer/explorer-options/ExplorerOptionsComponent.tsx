import React, { useState } from 'react';
import { Col, Icon, Row, TextInput } from 'react-materialize';
import { Notepad } from 'upad-parse/dist';
import { NPXObject } from 'upad-parse/dist/NPXObject';
import PathChangeComponent from '../path-change/PathChangeContainer';
import { ConnectedProps } from 'react-redux';
import { explorerOptionsConnector } from './ExplorerOptionsContainer';
import MoveComponent from '../move/MoveContainer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import Button2 from '../../Button';

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
				<Button2 className="accent-btn" waves="light" onClick={props.exportNotepad}>
					<Icon left={true}>file_download</Icon> Export Notebook
				</Button2>
			</Row>

			<Row>
				<Button2 className="accent-btn" waves="light" onClick={() => props.encrypt()}>
					<Icon left={true}>enhanced_encryption</Icon> Encrypt Notebook
				</Button2>

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
			<Row><Button2 className="accent-btn" waves="light" onClick={() => {
				props.loadNote((props.objToEdit as NPXObject).internalRef);
				setTimeout(() => props.print(), 500);
			}}>Export/Print Note (PDF)</Button2></Row>
		</div>
	);

	const modalId = `notepad-edit-object-modal-${(props.objToEdit as NPXObject).internalRef ?? `np-title-${props.objToEdit.title}`}`

	return (
		<SingletonModalComponent
			id={modalId}
			key={modalId}
			header={`Options for ${props.objToEdit.title}`}
			trigger={<a href="#!" className="exp-options-trigger" style={{ color: props.colour }} onContextMenu={e => {
				e.preventDefault();
				(e.target as Node).parentElement?.querySelector<HTMLAnchorElement>('.exp-options-trigger')?.click();
				return false;
			}}><Icon tiny={true} className="exp-options-trigger">settings</Icon></a>}
			options={DEFAULT_MODAL_OPTIONS}>
			<div className="explorer-options-modal">
				<Row>
					<form action="#!" onSubmit={e => {
						e.preventDefault();
						props.rename(titleView);
						return false;
					}}>
						<TextInput s={8} label="Title" value={titleView} onChange={e => setTitleView(e.target.value)} />
						<Col s={4}><Button2 className="accent-btn" waves="light">Rename {displayType}</Button2></Col>
					</form>
				</Row>
				<Row><Button2 className="red" waves="light" onClick={() => props.deleteObj()}><Icon
					left={true}>delete_forever</Icon> Delete {displayType}</Button2></Row>
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
