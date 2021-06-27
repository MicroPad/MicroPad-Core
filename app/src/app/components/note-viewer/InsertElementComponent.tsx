import * as React from 'react';
import { ElementArgs, NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../types/Themes';
import { InsertElementAction } from '../../types/ActionTypes';
import { generateGuid } from '../../util';
import { IInsertElementState } from '../../reducers/NoteReducer';
import { Icon } from 'react-materialize';
import JupyterInserterComponent from './elements/JupyterInserterComponent';
import { Note } from 'upad-parse/dist';
import './InsertElementComponent.css';

export interface IInsertElementComponentProps {
	note: Note;
	x: number;
	y: number;
	enabled: boolean;
	fontSize: string;
	theme: ITheme;
	isFullScreen: boolean;
	explorerWidth: number;
	insert?: (action: InsertElementAction) => void;
	toggleInsertMenu?: (opts: Partial<IInsertElementState>) => void;
	edit?: (id: string) => void;
}

export default class InsertElementComponent extends React.Component<IInsertElementComponentProps> {
	render() {
		const { note, enabled, fontSize, theme } = this.props;
		if (!enabled || !note) return null;

		const noteViewer = document.getElementById('note-viewer');
		if (!noteViewer) return null;
		const notepadExplorerWidth = document.querySelector<HTMLDivElement>('.notepad-explorer')?.offsetWidth ?? 0;

		const elementWidth = 307;
		const elementHeight = 325;

		const offsets = {
			left: notepadExplorerWidth - noteViewer.scrollLeft,
			top: noteViewer.scrollTop
		};

		const x = this.props.x + offsets.left;
		const y = this.props.y - offsets.top;

		const shouldFlipX = x > noteViewer.getBoundingClientRect().width - (elementWidth * 2);

		const containerStyles = {
			padding: 0,
			height: elementHeight + 'px',
			width: elementWidth + 'px',
			left: shouldFlipX ? x - elementWidth : x,
			top: (y < window.innerHeight - elementHeight - 200) ? y : y - elementHeight,
			zIndex: 5000,
			display: (enabled) ? undefined : 'none'
		};

		const insertX = this.props.x;
		const insertY = this.props.y;
		// const insertX = Math.abs(Math.floor(noteContainer.getBoundingClientRect().left) - x);
		// const insertY = (Math.abs(Math.floor(noteViewer.getBoundingClientRect().top)) + y) - FullScreenService.getOffset(isFullScreen);

		const defaultArgs: ElementArgs = {
			id: '',
			x: insertX + 'px',
			y: insertY + 'px',
			width: 'auto',
			height: 'auto'
		};

		return (
			<div className="noteElement" style={containerStyles}>
				<div id="insert-element" className="z-depth-2 hoverable" style={{ backgroundColor: theme.background, color: theme.text }}>
					<h4>Insert an element</h4>
					<ul>
						<li><a href="#!" onClick={() => this.doInsert({
							type: 'markdown',
							args: {
								...defaultArgs,
								fontSize: fontSize
							},
							content: ''
						})}><Icon left={true}>edit</Icon> Text (with markdown formatting)</a></li>

						<li><a href="#!" onClick={() => this.doInsert({
							type: 'image',
							args: {
								...defaultArgs,
								ext: generateGuid()
							},
							content: 'AS'
						})}><Icon left={true}>image</Icon> Image</a></li>

						<li><a href="#!" onClick={() => this.doInsert({
							type: 'drawing',
							args: {
								...defaultArgs,
								ext: generateGuid()
							},
							content: 'AS'
						})}><Icon left={true}>gesture</Icon> Drawing</a></li>

						<li><a href="#!" onClick={() => this.doInsert({
							type: 'pdf',
							args: {
								...defaultArgs,
								ext: generateGuid(),
								filename: ''
							},
							content: 'AS'
						})}><Icon left={true}>picture_as_pdf</Icon> PDF Document</a></li>

						<li><a href="#!" onClick={() => this.doInsert({
							type: 'file',
							args: {
								...defaultArgs,
								ext: generateGuid(),
								filename: ''
							},
							content: 'AS'
						})}><Icon left={true}>insert_drive_file</Icon> File</a></li>

						<li><a href="#!" onClick={() => this.doInsert({
							type: 'recording',
							args: {
								...defaultArgs,
								ext: generateGuid(),
								filename: ''
							},
							content: 'AS'
						})}><Icon left={true}>record_voice_over</Icon> Recording</a></li>

						<li><JupyterInserterComponent insertElement={element => this.doInsert({
							...element,
							args: {
								...defaultArgs,
								width: '500px'
							}
						})} /></li>
					</ul>
				</div>
			</div>
		);
	}

	private doInsert = (element: NoteElement) => {
		const { note, insert, toggleInsertMenu, edit } = this.props;
		toggleInsertMenu!({ enabled: false });

		const id = `${element.type}${generateGuid()}`;
		insert!({
			element: {
				...element,
				args: {
					...element.args,
					id
				}
			},
			noteRef: note.internalRef
		});

		edit!(id);
	}
}
