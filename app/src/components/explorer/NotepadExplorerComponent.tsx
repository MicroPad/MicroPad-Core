import * as React from 'react';
import './NotepadExplorerComponent.css';
import { INote, INotepad, IParent, IRenameNotepadObjectAction, ISection } from '../../types/NotepadTypes';
import { Icon } from 'react-materialize';
import TreeView from 'react-treeview';
import { generateGuid } from '../../util';
import ExplorerOptionsComponent from './ExplorerOptionsComponent';
import { INewNotepadObjectAction } from '../../types/ActionTypes';
import HelpMessageComponent from '../../containers/HelpMessageContainer';
import { Dialog } from '../../dialogs';
import SyncOptionsComponent from '../../containers/SyncOptionsContainer';

export interface INotepadExplorerComponentProps {
	notepad?: INotepad;
	openSections: string[];
	isFullScreen: boolean;
	openNote?: INote;
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
	expandFromNote?: (note: INote) => void;
	collapseAll?: () => void;
	newSection?: (obj: INewNotepadObjectAction) => void;
	newNote?: (obj: INewNotepadObjectAction) => void;
	print?: () => void;
}

export default class NotepadExplorerComponent extends React.Component<INotepadExplorerComponentProps> {
	private openSections: Set<string>;

	render() {
		const {
			notepad,
			isFullScreen,
			openNote,
			flipFullScreenState,
			deleteNotepad,
			exportNotepad,
			renameNotepad,
			expandAll,
			expandFromNote,
			collapseAll
		} = this.props;
		this.openSections = new Set<string>(this.props.openSections);

		const notepadExplorerStyle = {
			display: 'initial',
			transition: 'background-color .3s'
		};
		if (isFullScreen) notepadExplorerStyle.display = 'none';

		// Generate TreeViews
		const treeViews: JSX.Element[] = [];
		((notepad || {} as INotepad).sections || [])
			.forEach((section: ISection) => treeViews.push(this.generateSectionTreeView(section)));

		return (
			<div id="notepad-explorer" style={notepadExplorerStyle}>
				{
					!!notepad &&
					<div style={{ paddingBottom: '200px' }}>
						<a href="#!" onClick={flipFullScreenState} style={{ paddingRight: '5px', fontSize: '24px' }}>»</a>
						<strong style={{ display: 'inline-flex' }}>
							<span style={{ paddingRight: '5px' }}>{notepad.title}</span>
							<ExplorerOptionsComponent
								objToEdit={notepad}
								type="notepad"
								deleteNotepad={deleteNotepad}
								exportNotepad={exportNotepad}
								renameNotepad={renameNotepad}/>
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
							<a href="#!" style={{ color: 'white' }} onClick={() => this.newNotepadObject('section', notepad)}> <Icon>add</Icon> Section</a>
						</div>

						{treeViews}

						<div style={{ paddingLeft: '10px', marginTop: '10px' }}>
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
										message="Create/open a section and a note to insert elements:"
										video={require('../../assets/instructions/new-section.mp4')} />
								}
								{
									(
										notepad.sections.length > 0 &&
										notepad.sections.every(s => (s.notes.length > 0 || s.sections.length > 0))
									) &&
									<HelpMessageComponent
										message="Open a note to insert elements:"
										video={require('../../assets/instructions/open-note.mp4')} />
								}
							</React.Fragment>
						}
					</div>
				}

				{
					!notepad &&
					<HelpMessageComponent
						message="Open/create a notepad to start:"
						video={require('../../assets/instructions/open-notepad.mp4')} />
				}
			</div>
		);
	}

	private newNotepadObject = async (type: 'note' | 'section', parent: IParent) => {
		const { newNote, newSection } = this.props;
		const title = await Dialog.prompt('Title:');

		if (title) {
			const action: INewNotepadObjectAction = {
				title,
				parent
			};

			(type === 'note') ? newNote!(action) : newSection!(action);
		}
	}

	private generateSectionTreeView(section: ISection): JSX.Element {
		const { loadNote, deleteNotepadObject, renameNotepadObject, openNote, print } = this.props;

		const nodeLabelStyle = {
			display: 'inline-flex',
			verticalAlign: 'middle',
			paddingBottom: '10px',
			paddingTop: '10px'
		};

		const childSections: JSX.Element[] = [];
		((section || {} as ISection).sections || [])
			.forEach((child: ISection) => childSections.push(this.generateSectionTreeView(child)));

		const childNotes: JSX.Element[] = [];
		((section || {} as ISection).notes || [])
			.forEach((child: INote) => childNotes.push(
				<div className="explorer-note" key={generateGuid()}>
					<span>
						<a href="#!" style={{ color: 'white' }} onClick={() => loadNote!(child.internalRef)}><Icon>note</Icon> {child.title}</a>
						<ExplorerOptionsComponent
							objToEdit={child}
							type="note"
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
					<span style={nodeLabelStyle} onClick={(event: any) => {
						const path = event.path || (event.composedPath && event.composedPath()) || [event.target];
						if (
							path
								.map((element: HTMLElement) => element.classList)
								.some((classes: DOMTokenList) => classes.contains('exp-options-trigger'))
						) return;

						this.sectionArrowClick(section.internalRef);
					}}>
						<Icon>book</Icon> {section.title}
						<ExplorerOptionsComponent
							objToEdit={section}
							type="section"
							deleteNotepadObject={deleteNotepadObject}
							renameNotepadObject={renameNotepadObject}/>
					</span>}
					collapsed={!this.openSections.has(section.internalRef)}>
				<div className="explorer-note add-button" key={generateGuid()}>
					<a href="#!" style={{ color: 'white', paddingRight: '3px' }} onClick={() => this.newNotepadObject('note', section)}><Icon>add</Icon> Note </a>
					<a href="#!" style={{ color: 'white', paddingLeft: '3px' }} onClick={() => this.newNotepadObject('section', section)}> <Icon>add</Icon> Section</a>
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
