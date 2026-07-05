import React, { CSSProperties } from 'react';
import './NotepadExplorerComponent.css';
import { Icon } from 'react-materialize';
import TreeView from 'react-treeview';
import ExplorerOptionsComponent from './explorer-options/ExplorerOptionsContainer';
import { MoveNotepadObjectAction, NewNotepadObjectAction } from '../../types/ActionTypes';
import HelpMessageComponent from '../help-message/HelpMessageContainer';
import { Dialog } from '../../services/dialogs';
import SyncOptionsComponent from '../sync/sync-options/SyncOptionsContainer';
import { Note, Parent, Section } from 'upad-parse/dist';
import { NEW_SECTION_HELP, OPEN_NOTE_HELP, OPEN_NOTEPAD_HELP } from '../../types';
import DueDateListComponent from './due-date-list/DueDateListContainer';
import AppSettingsComponent from './app-settings/AppSettingsContainer';

// @ts-expect-error TS2307
import NewSectionVideo from '../../assets/instructions/new-section.mp4';
// @ts-expect-error TS2307
import OpenNoteVideo from '../../assets/instructions/open-note.mp4';
// @ts-expect-error TS2307
import OpenNotepadVideo from '../../assets/instructions/open-notepad.mp4';
import { notepadExplorerConnector } from './NotepadExplorerContainer';
import { ConnectedProps } from 'react-redux';
import { Resizable } from 're-resizable';
import Button2 from '../Button';
import { EXPLORER_DRAG_MIME, ExplorerDragItem } from './explorer-drag';

type Props = ConnectedProps<typeof notepadExplorerConnector>;

type DropZone = 'before' | 'into' | 'after';

type DragState = {
	item: ExplorerDragItem | null;
	dropTarget: string | null;
	setItem: (item: ExplorerDragItem | null) => void;
	setTarget: (target: string | null) => void;
	hoverCollapsedSection: (ref: string) => void;
	clearHoverTimer: () => void;
};

type DragCtx = {
	/** internalRef of the section the current row's siblings live in, or 'notepad' at the root */
	parentRef: string;
	/** internalRefs of every ancestor section of the current row */
	ancestors: readonly string[];
	prevSiblingRef?: string;
	nextSiblingRef?: string;
	drag: DragState;
};

const NotepadExplorerComponent = (props: Props) => {
	const { notepad, theme } = props;
	const openSections = new Set<string>(props.openSections);

	const [dragItem, setDragItem] = React.useState<ExplorerDragItem | null>(null);
	const [dropTarget, setDropTarget] = React.useState<string | null>(null);
	const hoverExpandTimer = React.useRef<{ ref: string, handle: number } | null>(null);

	const clearHoverTimer = () => {
		if (hoverExpandTimer.current !== null) {
			window.clearTimeout(hoverExpandTimer.current.handle);
			hoverExpandTimer.current = null;
		}
	};

	const drag: DragState = {
		item: dragItem,
		dropTarget,
		setItem: item => {
			setDragItem(item);
			if (!item) {
				setDropTarget(null);
				clearHoverTimer();
			}
		},
		setTarget: setDropTarget,
		hoverCollapsedSection: ref => {
			if (hoverExpandTimer.current?.ref === ref) return;
			clearHoverTimer();
			hoverExpandTimer.current = {
				ref,
				handle: window.setTimeout(() => {
					hoverExpandTimer.current = null;
					props.expandSection(ref);
				}, 700)
			};
		},
		clearHoverTimer
	};

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
	notepad?.sections?.forEach((section, i) => treeViews.push(generateSectionTreeView(props, section, openSections, {
		parentRef: 'notepad',
		ancestors: [],
		prevSiblingRef: notepad.sections[i - 1]?.internalRef,
		nextSiblingRef: notepad.sections[i + 1]?.internalRef,
		drag
	})));

	return (
		<Resizable
			className={`notepad-explorer${!!dragItem ? ' notepad-explorer--dragging' : ''}`}
			style={notepadExplorerStyle}
			size={{ width: props.explorerWidth, height: 'auto' }}
			minWidth={0}
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
				if (parseInt(ref.style.width, 10) <= 242) { // 20px diff to the explorer size in the store
					setTimeout(() => props.flipFullScreenState(), 0);
				} else {
					props.setExplorerWidth(ref.style.width)
				}
			}}>
			<div>
				<Button2 tooltip="Enter full screen" flat onClick={props.flipFullScreenState}><Icon aria-label="full screen">fullscreen</Icon></Button2>
				<DueDateListComponent />
			</div>

			{
				!!notepad &&
				<div>
					<strong style={{ display: 'inline-flex' }}
					        className={dropTarget === 'root:end' ? 'explorer-drop--into' : undefined}
					        onContextMenu={handleRightClick}
					        onDragOver={e => {
					        	// Only sections may live at the notebook root
					        	if (dragItem?.type !== 'section') return;
					        	e.preventDefault();
					        	e.stopPropagation();
					        	e.dataTransfer.dropEffect = 'move';
					        	if (dropTarget !== 'root:end') setDropTarget('root:end');
					        }}
					        onDrop={e => {
					        	if (dragItem?.type !== 'section') return;
					        	e.preventDefault();
					        	e.stopPropagation();
					        	props.moveObj({ type: 'section', objectRef: dragItem.internalRef, newParent: 'notepad', position: 'end' });
					        	drag.setItem(null);
					        }}
					        onDragLeave={e => {
					        	if (!e.currentTarget.contains(e.relatedTarget as Node) && dropTarget === 'root:end') setDropTarget(null);
					        }}>
							<span>
								{notepad.title}
								{props.isReadOnly && <em style={{ paddingLeft: '5px' }}>(Read-Only)</em>}
							</span>
						<ExplorerOptionsComponent objToEdit={notepad} type="notepad" key={notepad.title} />
					</strong>

					<p style={{ marginTop: '0px' }}>
						<Button2 flat onClick={props.expandAll} tooltip="Expand all"><Icon aria-label="expand all">unfold_more</Icon></Button2>
						{props.openNote && <Button2 tooltip="Show current note" flat onClick={() => {
							props.collapseAll();
							props.expandFromNote(props.openNote);
						}}><Icon aria-label="focus">gps_fixed</Icon></Button2>}
						{props.openSections.length > 0 && <Button2 flat onClick={props.collapseAll} tooltip="Collapse all"><Icon aria-label="collapse all">unfold_less</Icon></Button2>}
					</p>

					<div className="explorer-note add-button" key={`${notepad.title}__new-section`} style={{ margin: 0 }}>
						<Button2 flat onClick={() => newNotepadObject(props, 'section', notepad)}>
							<Icon>add</Icon> Section
						</Button2>
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

function generateSectionTreeView(props: Props, section: Section, openSections: Set<string>, ctx: DragCtx): JSX.Element {
	const { theme, loadNote } = props;
	const { drag } = ctx;

	const nodeLabelStyle = {
		display: 'inline-flex',
		verticalAlign: 'middle',
		paddingBottom: '10px',
		paddingTop: '10px'
	};

	const isExpanded = openSections.has(section.internalRef);

	const childSections: JSX.Element[] = [];
	section.sections.forEach((child: Section, i: number) => childSections.push(generateSectionTreeView(props, child, openSections, {
		parentRef: section.internalRef,
		ancestors: [...ctx.ancestors, section.internalRef],
		prevSiblingRef: section.sections[i - 1]?.internalRef,
		nextSiblingRef: section.sections[i + 1]?.internalRef,
		drag
	})));

	const childNotes: JSX.Element[] = [];
	section.notes.forEach((child: Note, i: number) => {
		const prevNoteRef: string | undefined = section.notes[i - 1]?.internalRef;
		const nextNoteRef: string | undefined = section.notes[i + 1]?.internalRef;

		// Gaps between note rows only accept notes (the save format can't interleave notes with sections)
		const notePayload = (zone: DropZone): MoveNotepadObjectAction | null => {
			const item = drag.item;
			if (!item || item.type !== 'note' || item.internalRef === child.internalRef) return null;
			if (zone === 'before') {
				if (prevNoteRef === item.internalRef) return null; // already right above
				return { type: 'note', objectRef: item.internalRef, newParent: section.internalRef, position: { beforeRef: child.internalRef } };
			}
			if (nextNoteRef === item.internalRef) return null; // already right below
			return { type: 'note', objectRef: item.internalRef, newParent: section.internalRef, position: nextNoteRef ? { beforeRef: nextNoteRef } : 'end' };
		};

		childNotes.push(
			<div
				className={dropClasses('explorer-note', child.internalRef, drag)}
				key={`${child.internalRef}__entry`}
				draggable
				onDragStart={e => startDrag(e, { type: 'note', internalRef: child.internalRef }, drag)}
				onDragEnd={() => drag.setItem(null)}
				onDragOver={e => {
					const zone = zoneFromEvent(e, 'note');
					handleRowDragOver(e, child.internalRef, zone, notePayload(zone), drag);
				}}
				onDrop={e => handleRowDrop(e, notePayload(zoneFromEvent(e, 'note')), drag, props.moveObj)}
				onDragLeave={e => handleRowDragLeave(e, child.internalRef, drag)}>
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
		);
	});

	const sectionZone = (e: React.DragEvent<HTMLElement>): DropZone =>
		zoneFromEvent(e, isExpanded ? 'section-expanded' : 'section-collapsed');

	const sectionPayload = (zone: DropZone): MoveNotepadObjectAction | null => {
		const item = drag.item;
		if (!item) return null;
		// Never into/around itself; nor may a section land inside its own subtree
		if (item.internalRef === section.internalRef) return null;
		if (item.type === 'section' && ctx.ancestors.includes(item.internalRef)) return null;

		if (zone === 'into') return { type: item.type, objectRef: item.internalRef, newParent: section.internalRef, position: 'end' };

		// Gaps between section rows only accept sections
		if (item.type !== 'section') return null;
		if (zone === 'before') {
			if (ctx.prevSiblingRef === item.internalRef) return null; // already right above
			return { type: 'section', objectRef: item.internalRef, newParent: ctx.parentRef, position: { beforeRef: section.internalRef } };
		}
		if (ctx.nextSiblingRef === item.internalRef) return null; // already right below
		return { type: 'section', objectRef: item.internalRef, newParent: ctx.parentRef, position: ctx.nextSiblingRef ? { beforeRef: ctx.nextSiblingRef } : 'end' };
	};

	return (
		<TreeView
			key={`${section.internalRef}__entry`}
			onClick={() => sectionArrowClick(props, section.internalRef, openSections)}
			nodeLabel={
				<span
					className={dropClasses('explorer-section-label', section.internalRef, drag)}
					draggable
					onDragStart={e => startDrag(e, { type: 'section', internalRef: section.internalRef }, drag)}
					onDragEnd={() => drag.setItem(null)}
					onDragOver={e => {
						const zone = sectionZone(e);
						const payload = sectionPayload(zone);
						handleRowDragOver(e, section.internalRef, zone, payload, drag);
						if (!drag.item) return;
						if (!!payload && zone === 'into' && !isExpanded) {
							drag.hoverCollapsedSection(section.internalRef);
						} else {
							drag.clearHoverTimer();
						}
					}}
					onDrop={e => {
						const zone = sectionZone(e);
						handleRowDrop(e, sectionPayload(zone), drag, props.moveObj,
							zone === 'into' ? () => props.expandSection(section.internalRef) : undefined);
					}}
					onDragLeave={e => handleRowDragLeave(e, section.internalRef, drag)}>
						<span
							style={nodeLabelStyle}
							onClick={() => sectionArrowClick(props, section.internalRef, openSections)}
							onContextMenu={handleRightClick}>
							<Icon>book</Icon> {section.title}
						</span>

						<ExplorerOptionsComponent objToEdit={section} type="section"/>
					</span>
			}
			collapsed={!isExpanded}>
			<div className="explorer-note add-button" key={`${section.internalRef}__new-obj`}>
				<Button2 flat onClick={() => newNotepadObject(props, 'note', section)}>
					<Icon>add</Icon> Note
				</Button2>
				<Button2 flat onClick={() => newNotepadObject(props, 'section', section)}>
					<Icon>add</Icon> Section
				</Button2>
			</div>

			{childSections}
			{childNotes}
		</TreeView>
	);
}

function startDrag(e: React.DragEvent<HTMLElement>, item: ExplorerDragItem, drag: DragState): void {
	e.stopPropagation();
	// getData() is blocked during dragover ("protected mode"), so the live payload lives in
	// DragState; setData still runs so Firefox starts the drag and other drop targets can
	// recognise explorer drags via dataTransfer.types.
	e.dataTransfer.setData(EXPLORER_DRAG_MIME, JSON.stringify(item));
	e.dataTransfer.effectAllowed = 'move';
	drag.setItem(item);
}

function zoneFromEvent(e: React.DragEvent<HTMLElement>, kind: 'section-collapsed' | 'section-expanded' | 'note'): DropZone {
	const rect = e.currentTarget.getBoundingClientRect();
	const frac = rect.height === 0 ? 0.5 : (e.clientY - rect.top) / rect.height;

	if (kind === 'note') return frac < 0.5 ? 'before' : 'after';
	if (frac < 0.25) return 'before';
	// An expanded section's subtree renders below its label, so a drop "after" it would look
	// like a drop inside it. Only collapsed sections offer the "after" gap (VS Code behaviour).
	if (kind === 'section-collapsed' && frac > 0.75) return 'after';
	return 'into';
}

function handleRowDragOver(e: React.DragEvent<HTMLElement>, ref: string, zone: DropZone, payload: MoveNotepadObjectAction | null, drag: DragState): void {
	if (!drag.item) return; // not an explorer drag (e.g. an OS file): let it fall through
	if (!payload) {
		e.dataTransfer.dropEffect = 'none';
		if (drag.dropTarget?.startsWith(`${ref}:`)) drag.setTarget(null);
		return;
	}
	e.preventDefault();
	e.stopPropagation();
	e.dataTransfer.dropEffect = 'move';
	const key = `${ref}:${zone}`;
	if (drag.dropTarget !== key) drag.setTarget(key); // dragover fires per frame: only setState on change
}

function handleRowDrop(
	e: React.DragEvent<HTMLElement>,
	payload: MoveNotepadObjectAction | null,
	drag: DragState,
	moveObj: (payload: MoveNotepadObjectAction) => void,
	onMoved?: () => void
): void {
	if (!drag.item) return;
	e.preventDefault();
	e.stopPropagation();
	if (payload) {
		moveObj(payload);
		if (onMoved) onMoved();
	}
	drag.setItem(null);
}

function handleRowDragLeave(e: React.DragEvent<HTMLElement>, ref: string, drag: DragState): void {
	if (e.currentTarget.contains(e.relatedTarget as Node)) return;
	if (drag.dropTarget?.startsWith(`${ref}:`)) drag.setTarget(null);
	drag.clearHoverTimer();
}

function dropClasses(base: string, ref: string, drag: DragState): string {
	const classes = [base];
	if (drag.item?.internalRef === ref) classes.push('explorer-drag-source');
	if (drag.dropTarget === `${ref}:before`) classes.push('explorer-drop--before');
	else if (drag.dropTarget === `${ref}:into`) classes.push('explorer-drop--into');
	else if (drag.dropTarget === `${ref}:after`) classes.push('explorer-drop--after');
	return classes.join(' ');
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
