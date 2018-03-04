import * as React from 'react';
import './NotepadExplorerComponent.css';
import { INote, INotepad, ISection } from '../../types/NotepadTypes';
import { Icon } from 'react-materialize';
import TreeView from 'react-treeview';
import { generateGuid } from '../../util';
import ExplorerOptionsComponent from './ExplorerOptionsComponent';

export interface INotepadExplorerComponentProps {
	notepad?: INotepad;
	openSections: string[];
	isFullScreen: boolean;
	flipFullScreenState?: () => void;
	deleteNotepad?: (title: string) => void;
	exportNotepad?: () => void;
	renameNotepad?: (newTitle: string) => void;
	deleteNotepadObject?: (internalId: string) => void;
	renameNotepadObject?: (internalId: string) => void;
	loadNote?: (note: INote) => void;
	expandSection?: (guid: string) => void;
	collapseSection?: (guid: string) => void;
}

export default class NotepadExplorerComponent extends React.Component<INotepadExplorerComponentProps> {
	private openSections: Set<string>;

	render() {
		const { notepad, isFullScreen, flipFullScreenState, deleteNotepad, exportNotepad } = this.props;
		this.openSections = new Set<string>(this.props.openSections);

		const notepadExplorerStyle = {
			display: 'initial'
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
					<div style={{paddingBottom: '200px'}}>
						<a href="#!" onClick={flipFullScreenState} style={{color: 'white', paddingRight: '5px', fontSize: '24px'}}>»</a>
						<strong style={{display: 'inline-flex'}}>
							{notepad.title}
							<ExplorerOptionsComponent objToEdit={notepad} type="notepad" deleteNotepad={deleteNotepad} exportNotepad={exportNotepad} />
						</strong>
						{treeViews}
					</div>
				}
			</div>
		);
	}

	private generateSectionTreeView(section: ISection): JSX.Element {
		const { loadNote } = this.props;

		const nodeLabelStyle = {
			display: 'inline-flex',
			verticalAlign: 'middle',
			paddingBottom: '5px',
			paddingTop: '5px'
		};

		const childSections: JSX.Element[] = [];
		((section || {} as ISection).sections || [])
			.forEach((child: ISection) => childSections.push(this.generateSectionTreeView(child)));

		const childNotes: JSX.Element[] = [];
		((section || {} as ISection).notes || [])
			.forEach((child: INote) => childNotes.push(
				<div className="explorer-note" key={generateGuid()}>
					<span><a href="#!" style={{color: 'white'}} onClick={() => loadNote!(child)}><Icon>note</Icon> {child.title}</a>
					<ExplorerOptionsComponent objToEdit={child} type="note" /></span>
				</div>
			));

		return (
			<TreeView
				key={generateGuid()}
				onClick={() => this.sectionArrowClick(section.internalRef)}
				nodeLabel={<span style={nodeLabelStyle}><Icon>book</Icon> {section.title} <ExplorerOptionsComponent objToEdit={section} type="section" /></span>}
				collapsed={!this.openSections.has(section.internalRef)}>
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
