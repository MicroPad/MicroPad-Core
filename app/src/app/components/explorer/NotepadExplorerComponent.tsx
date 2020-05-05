import * as React from 'react';
import { CSSProperties } from 'react';
import './NotepadExplorerComponent.css';
import { IRenameNotepadObjectAction } from '../../types/NotepadTypes';
import { Icon } from 'react-materialize';
import TreeView from 'react-treeview';
import { generateGuid } from '../../util';
import ExplorerOptionsComponent from './ExplorerOptionsComponent';
import { NewNotepadObjectAction } from '../../types/ActionTypes';
import HelpMessageComponent from '../../containers/HelpMessageContainer';
import { Dialog } from '../../services/dialogs';
import SyncOptionsComponent from '../../containers/SyncOptionsContainer';
import { Note, Notepad, Parent, Section } from 'upad-parse/dist';
import { ITheme } from '../../types/Themes';
import { NEW_SECTION_HELP, OPEN_NOTE_HELP, OPEN_NOTEPAD_HELP } from '../../types';
import DueDateListComponent from '../../containers/DueDateListContainer';
import AppSettingsComponent from '../../containers/AppSettingsContainer';

export interface INotepadExplorerComponentProps {
	notepad?: Notepad;
	openSections: string[];
	isFullScreen: boolean;
	openNote?: Note;
	theme: ITheme;
	flipFullScreenState?: () => void;
	deleteNotepad?: (title: string) => void;
	exportNotepad?: () => void;
	renameNotepad?: (newTitle: string) => void;
	deleteNotepadObject?: (internalId: string) => void;
	renameNotepadObject?: (params: IRenameNotepadObjectAction) => void;
	loadNote?: (ref: string) => void;
	expandSection?: (guid: string) => void;
	collapseSection?: (guid: string) => void;
	expandAll?: () => void;
	expandFromNote?: (note: Note) => void;
	collapseAll?: () => void;
	newSection?: (obj: NewNotepadObjectAction) => void;
	newNote?: (obj: NewNotepadObjectAction) => void;
	print?: () => void;
	encrypt?: (notepad: Notepad, passkey: string) => void;
}

export default class NotepadExplorerComponent extends React.Component<INotepadExplorerComponentProps> {
	private openSections!: Set<string>;

	render() {
		const {
			notepad,
			isFullScreen,
			openNote,
			theme,
			flipFullScreenState,
			deleteNotepad,
			exportNotepad,
			renameNotepad,
			expandAll,
			expandFromNote,
			collapseAll,
			encrypt
		} = this.props;
		this.openSections = new Set<string>(this.props.openSections);

		const notepadExplorerStyle: CSSProperties = {
			display: 'initial',
			transition: 'background-color .3s',
			backgroundColor: theme.chrome,
			borderLeft: `2px solid ${theme.accent}`,
			color: theme.explorerContent
		};
		if (isFullScreen) notepadExplorerStyle.display = 'none';

		// Generate TreeViews
		const treeViews: JSX.Element[] = [];
		((notepad || {} as Notepad).sections || [])
			.forEach((section: Section) => treeViews.push(this.generateSectionTreeView(section)));

		return (
			<div id="notepad-explorer" style={notepadExplorerStyle}>
				{
					!!notepad &&
					<div>
						<a href="#!" onClick={flipFullScreenState} style={{ paddingRight: '5px', fontSize: '24px' }}>»</a>
						<strong style={{ display: 'inline-flex' }}>
							<span style={{ paddingRight: '5px' }}>{notepad.title}</span>
							<ExplorerOptionsComponent
								objToEdit={notepad}
								type="notepad"
								colour={theme.explorerContent}
								deleteNotepad={deleteNotepad}
								exportNotepad={exportNotepad}
								renameNotepad={renameNotepad}
								encrypt={encrypt}/>
						</strong>

						<p style={{paddingLeft: '10px', marginTop: '0px'}}>
							(<a href="#!" onClick={expandAll}>Expand All</a> | <a href="#!" onClick={() => {
								if (!!openNote) {
									collapseAll!();
									expandFromNote!(openNote);
								}
							}}>Focus</a> | <a href="#!" onClick={collapseAll}>Collapse All</a>)
						</p>

						<div className="explorer-note add-button" key={generateGuid()} style={{margin: 0}}>
							<a href="#!" style={{ color: theme.explorerContent }} onClick={() => this.newNotepadObject('section', notepad)}> <Icon>add</Icon> Section</a>
						</div>

						{treeViews}

						<div style={{ paddingLeft: '10px', marginTop: '10px' }}>
							<DueDateListComponent />
							<SyncOptionsComponent />
						</div>

						{
							/* Help messages */
							!openNote &&
							<React.Fragment>
								{
									(
										notepad.sections.length === 0 ||
										notepad.sections.some(s => s.notes.length === 0 && s.sections.length === 0)
									) &&
									<HelpMessageComponent
										message={NEW_SECTION_HELP}
										video={require('../../assets/instructions/new-section.mp4')} />
								}
								{
									(
										notepad.sections.length > 0 &&
										notepad.sections.every(s => (s.notes.length > 0 || s.sections.length > 0))
									) &&
									<HelpMessageComponent
										message={OPEN_NOTE_HELP}
										video={require('../../assets/instructions/open-note.mp4')} />
								}
							</React.Fragment>
						}
					</div>
				}

				{
					!notepad &&
					<HelpMessageComponent
						message={OPEN_NOTEPAD_HELP}
						video={require('../../assets/instructions/open-notepad.mp4')} />
				}

				{!!notepad && <hr />}
				<div style={{ paddingBottom: '200px' }}>
					<AppSettingsComponent />
				</div>
			</div>
		);
	}

	private newNotepadObject = async (type: 'note' | 'section', parent: Parent) => {
		const { newNote, newSection } = this.props;
		const title = await Dialog.prompt('Title:');

		if (title) {
			const action: NewNotepadObjectAction = {
				title,
				parent: (parent as Section).internalRef // will automatically be undefined for Notepad parents
			};

			(type === 'note') ? newNote!(action) : newSection!(action);
		}
	}

	private generateSectionTreeView(section: Section): JSX.Element {
		const { theme, loadNote, deleteNotepadObject, renameNotepadObject, openNote, print } = this.props;

		const nodeLabelStyle = {
			display: 'inline-flex',
			verticalAlign: 'middle',
			paddingBottom: '10px',
			paddingTop: '10px'
		};

		const childSections: JSX.Element[] = [];
		((section || {} as Section).sections || [])
			.forEach((child: Section) => childSections.push(this.generateSectionTreeView(child)));

		const childNotes: JSX.Element[] = [];
		((section || {} as Section).notes || [])
			.forEach((child: Note) => childNotes.push(
				<div className="explorer-note" key={generateGuid()}>
					<span>
						<a href="#!" style={{ color: theme.explorerContent }} onClick={() => loadNote!(child.internalRef)}><Icon>note</Icon> {child.title}</a>
						<ExplorerOptionsComponent
							objToEdit={child}
							type="note"
							colour={theme.explorerContent}
							loadNote={() => {
								if (!openNote || openNote.internalRef !== child.internalRef) loadNote!(child.internalRef);
							}}
							print={print}
							deleteNotepadObject={deleteNotepadObject}
							renameNotepadObject={renameNotepadObject}/>
					</span>
				</div>
			));

		return (
			<TreeView
				key={generateGuid()}
				onClick={() => this.sectionArrowClick(section.internalRef)}
				nodeLabel={
					<span>
						<span style={nodeLabelStyle} onClick={() => this.sectionArrowClick(section.internalRef)}>
							<Icon>book</Icon> {section.title}
						</span>

						<ExplorerOptionsComponent
							objToEdit={section}
							type="section"
							colour={theme.explorerContent}
							deleteNotepadObject={deleteNotepadObject}
							renameNotepadObject={renameNotepadObject}/>
					</span>
				}
				collapsed={!this.openSections.has(section.internalRef)}>
				<div className="explorer-note add-button" key={generateGuid()}>
					<a href="#!" style={{ color: theme.explorerContent, paddingRight: '3px' }} onClick={() => this.newNotepadObject('note', section)}><Icon>add</Icon> Note </a>
					<a href="#!" style={{ color: theme.explorerContent, paddingLeft: '3px' }} onClick={() => this.newNotepadObject('section', section)}> <Icon>add</Icon> Section</a>
				</div>

				{childSections}
				{childNotes}
			</TreeView>
		);
	}

	private sectionArrowClick = (guid: string) => {
		const { expandSection, collapseSection } = this.props;

		if (this.openSections.has(guid)) {
			collapseSection!(guid);
		} else {
			expandSection!(guid);
		}
	}
}
