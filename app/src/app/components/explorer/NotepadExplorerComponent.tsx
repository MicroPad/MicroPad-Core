import * as React from 'react';
import { CSSProperties } from 'react';
import './NotepadExplorerComponent.css';
import { Button, Icon } from 'react-materialize';
import TreeView from 'react-treeview';
import ExplorerOptionsComponent from './explorer-options/ExplorerOptionsContainer';
import { NewNotepadObjectAction } from '../../types/ActionTypes';
import HelpMessageComponent from '../../containers/HelpMessageContainer';
import { Dialog } from '../../services/dialogs';
import SyncOptionsComponent from '../../containers/SyncOptionsContainer';
import { Note, Parent, Section } from 'upad-parse/dist';
import { NEW_SECTION_HELP, OPEN_NOTE_HELP, OPEN_NOTEPAD_HELP } from '../../types';
import DueDateListComponent from './due-date-list/DueDateListContainer';
import AppSettingsComponent from './app-settings/AppSettingsContainer';

// @ts-ignore
import NewSectionVideo from '../../assets/instructions/new-section.mp4';
// @ts-ignore
import OpenNoteVideo from '../../assets/instructions/open-note.mp4';
// @ts-ignore
import OpenNotepadVideo from '../../assets/instructions/open-notepad.mp4';
import { notepadExplorerConnector } from './NotepadExplorerContainer';
import { ConnectedProps } from 'react-redux';
import { Resizable } from 're-resizable';

type Props = ConnectedProps<typeof notepadExplorerConnector>;

const NotepadExplorerComponent = (props: Props) => {
	const { notepad, theme } = props;
	const openSections = new Set<string>(props.openSections);

	const notepadExplorerStyle: CSSProperties = {
		display: 'initial',
		transition: 'background-color .3s',
		backgroundColor: theme.chrome,
		borderRight: `2px solid ${theme.accent}`,
		color: theme.explorerContent
	};
	if (props.isFullScreen) return null;

	// Generate TreeViews
	const treeViews: JSX.Element[] = [];
	notepad?.sections?.forEach(section => treeViews.push(generateSectionTreeView(props, section, openSections)));

	return (
		<Resizable
			className="notepad-explorer"
			style={notepadExplorerStyle}
			size={{ width: props.explorerWidth, height: 'auto' }}
			minWidth={240}
			enable={{ right: true }}
			handleWrapperClass="notepad-explorer__drag-handle"
			handleStyles={{
				right: {
					position: 'fixed',
					left: props.explorerWidth,
					right: 0,
					height: '100vh'
				}
			}}
			onResizeStop={(_e, _d, ref) => {
				if (ref.style.width === '240px') {
					props.flipFullScreenState();
				} else {
					props.setExplorerWidth(ref.style.width)
				}
			}}>
			<div>
				<a href="#!" onClick={props.flipFullScreenState} style={{ fontSize: '24px', marginRight: '10px' }}>«</a>
				<DueDateListComponent />
			</div>

			{
				!!notepad &&
				<div>
					<strong style={{ display: 'inline-flex' }}
					        onContextMenu={handleRightClick}>
							<span>
								{notepad.title}
								{props.isReadOnly && <em style={{ paddingLeft: '5px' }}>(Read-Only)</em>}
							</span>
						<ExplorerOptionsComponent objToEdit={notepad} type="notepad"/>
					</strong>

					<p style={{ marginTop: '0px' }}>
						(<a href="#!" onClick={props.expandAll}>Expand All</a> | <a href="#!" onClick={() => {
						if (!!props.openNote) {
							props.collapseAll();
							props.expandFromNote(props.openNote);
						}
					}}>Focus</a> | <a href="#!" onClick={props.collapseAll}>Collapse All</a>)
					</p>

					<div className="explorer-note add-button" key={`${notepad.title}__new-section`} style={{ margin: 0 }}>
						<Button flat onClick={() => newNotepadObject(props, 'section', notepad)}>
							<Icon>add</Icon> Section
						</Button>
					</div>

					{treeViews}

					<div style={{ marginTop: '10px' }}>
						<SyncOptionsComponent/>
					</div>

					{
						/* Help messages */
						!props.openNote &&
						<React.Fragment>
							{
								(
									notepad.sections.length === 0 ||
									notepad.sections.some(s => s.notes.length === 0 && s.sections.length === 0)
								) &&
								<HelpMessageComponent
									message={NEW_SECTION_HELP}
									video={NewSectionVideo}/>
							}
							{
								(
									notepad.sections.length > 0 &&
									notepad.sections.every(s => (s.notes.length > 0 || s.sections.length > 0))
								) &&
								<HelpMessageComponent
									message={OPEN_NOTE_HELP}
									video={OpenNoteVideo}/>
							}
						</React.Fragment>
					}
				</div>
			}

			{
				!notepad &&
				<HelpMessageComponent
					message={OPEN_NOTEPAD_HELP}
					video={OpenNotepadVideo}/>
			}

			{!!notepad && <hr/>}
			<div style={{ paddingBottom: '200px' }}>
				<AppSettingsComponent/>
			</div>
		</Resizable>
	);
}
export default NotepadExplorerComponent;

async function newNotepadObject({ newNote, newSection }: Props, type: 'note' | 'section', parent: Parent) {
	const title = await Dialog.prompt(`${type.charAt(0).toUpperCase() + type.slice(1)} title:`);

	if (title) {
		const action: NewNotepadObjectAction = {
			title,
			parent: (parent as Section).internalRef // will automatically be undefined for Notepad parents
		};

		(type === 'note') ? newNote(action) : newSection(action);
	}
}

function generateSectionTreeView(props: Props, section: Section, openSections: Set<string>): JSX.Element {
	const { theme, loadNote } = props;

	const nodeLabelStyle = {
		display: 'inline-flex',
		verticalAlign: 'middle',
		paddingBottom: '10px',
		paddingTop: '10px'
	};

	const childSections: JSX.Element[] = [];
	section.sections.forEach((child: Section) => childSections.push(generateSectionTreeView(props, child, openSections)));

	const childNotes: JSX.Element[] = [];
	section.notes.forEach((child: Note) =>
		childNotes.push(
			<div className="explorer-note" key={`${child.internalRef}__entry`}>
					<span>
						<a
							href="#!"
							style={{ color: theme.explorerContent }} onClick={() => loadNote(child.internalRef)}
							onContextMenu={handleRightClick}>
							<Icon>note</Icon> {child.title}
						</a>
						<ExplorerOptionsComponent objToEdit={child} type="note"/>
					</span>
			</div>
		)
	);

	return (
		<TreeView
			key={`${section.internalRef}__entry`}
			onClick={() => sectionArrowClick(props, section.internalRef, openSections)}
			nodeLabel={
				<span>
						<span
							style={nodeLabelStyle}
							onClick={() => sectionArrowClick(props, section.internalRef, openSections)}
							onContextMenu={handleRightClick}>
							<Icon>book</Icon> {section.title}
						</span>

						<ExplorerOptionsComponent objToEdit={section} type="section"/>
					</span>
			}
			collapsed={!openSections.has(section.internalRef)}>
			<div className="explorer-note add-button" key={`${section.internalRef}__new-obj`}>
				<Button flat onClick={() => newNotepadObject(props, 'note', section)}>
					<Icon>add</Icon> Note
				</Button>
				<Button flat onClick={() => newNotepadObject(props, 'section', section)}>
					<Icon>add</Icon> Section
				</Button>
			</div>

			{childSections}
			{childNotes}
		</TreeView>
	);
}

function sectionArrowClick({ expandSection, collapseSection }: Props, guid: string, openSections: Set<string>) {
	if (openSections.has(guid)) {
		collapseSection(guid);
	} else {
		expandSection(guid);
	}
}

function handleRightClick(e: React.MouseEvent<HTMLElement, MouseEvent>): boolean {
	e.preventDefault();
	(e.target as Node).parentElement?.querySelector<HTMLAnchorElement>('.exp-options-trigger')?.click();
	return false;
}
