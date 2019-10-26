import * as React from 'react';
import { CSSProperties } from 'react';
import './NoteViewerComponent.css';
import NoteElementComponent from './elements/NoteElementComponent';
import * as Materialize from 'materialize-css/dist/js/materialize.js';
import { ProgressBar } from 'react-materialize';
import { filter, map } from 'rxjs/operators';
import { fromEvent, Observable } from 'rxjs';
import { IInsertElementState } from '../../../core/reducers/NoteReducer';
import ZoomComponent from '../../containers/ZoomContainer';
import { Note } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../../core/types/Themes';
import { FullScreenService } from '../../FullscreenService';
import { TOAST_HANDLER } from '../..';
import { generateGuid } from '../../util';

export interface INoteViewerComponentProps {
	isLoading: boolean;
	isFullscreen: boolean;
	zoom: number;
	note?: Note;
	elementEditing: string;
	noteAssets: object;
	isNotepadOpen: boolean;
	theme: ITheme;
	edit?: (id: string) => void;
	search?: (query: string) => void;
	downloadAsset?: (filename: string, uuid: string) => void;
	updateElement?: (id: string, changes: NoteElement, newAsset?: Blob) => void;
	toggleInsertMenu?: (opts: Partial<IInsertElementState>) => void;
	insert?: (element: NoteElement) => void;
	deleteElement?: (id: string) => void;
	deleteNotepad?: () => void;
	makeQuickNotepad?: () => void;
	makeQuickNote?: () => void;
}

export default class NoteViewerComponent extends React.Component<INoteViewerComponentProps> {
	private viewerDiv: HTMLDivElement;
	private containerDiv: HTMLDivElement;
	private escapeHit$: Observable<number>;
	private scrolling: boolean;

	constructor(props: INoteViewerComponentProps) {
		super(props);

		this.escapeHit$ = fromEvent(document, 'keyup')
			.pipe(
				map((event: KeyboardEvent) => event.keyCode),
				filter(keyCode => keyCode === 27)
			);
	}

	render() {
		const {
			isLoading,
			zoom,
			isFullscreen,
			note,
			noteAssets,
			search,
			downloadAsset,
			elementEditing,
			theme,
			isNotepadOpen,
			edit,
			updateElement,
			deleteElement,
			insert
		} = this.props;

		let backgroundImage: string = '';
		if (!isNotepadOpen) {
			backgroundImage = `url(${theme.instructionImages.notepad}), `;
		} else if (isNotepadOpen && !note) {
			backgroundImage = `url(${theme.instructionImages.note}), `;
		} else if (isNotepadOpen && !!note && note.elements.length === 0) {
			backgroundImage = `url(${theme.instructionImages.element}), `;
		} else {
			backgroundImage = 'url(), ';
		}

		if (!note || note.elements.length === 0) backgroundImage += `url(${theme.backgroundImage})`;

		let styles: CSSProperties = {
			backgroundImage: backgroundImage !== 'url(), ' ? backgroundImage : undefined,
			transition: 'background-image .3s'
		};

		if (isFullscreen) styles = {
			...styles,
			width: '100vw'
		};

		const containerStyles = {
			minWidth: '100%',
			minHeight: '100%',
			position: 'relative' as 'relative',
			transform: `scale(${zoom})`,
			transformOrigin: '0 0',
			WebkitTransformOrigin: '0 0'
		};

		const elements: JSX.Element[] = [];
		if (!!note) note.elements.forEach(element => elements.push(
			<NoteElementComponent
				key={`${note.internalRef}-${element.args.id}`}
				element={element}
				noteAssets={noteAssets}
				theme={theme}
				edit={edit!}
				deleteElement={deleteElement!}
				search={search!}
				updateElement={updateElement}
				downloadAsset={downloadAsset}
				elementEditing={elementEditing}
				isFullscreen={isFullscreen}
				insert={insert} />
		));

		return (
			<div
				id="note-viewer"
				style={styles}
				ref={div => this.viewerDiv = div!}
				onClick={this.handleEmptyClick}
				onScroll={() => this.scrolling = true}
				onDrop={event => this.handleFileDrop(event as any)}
				onDragOver={e => {
					e.stopPropagation();
					e.preventDefault();
				}}>
				{isLoading && <div id="progress-bar"><ProgressBar className="amber" /></div>}
				<div id="note-container" style={containerStyles} ref={div => this.containerDiv = div!}>
					{elements}
				</div>
				{!!note && isFullscreen && <ZoomComponent />}
			</div>
		);
	}

	componentDidMount() {
		const { edit, toggleInsertMenu } = this.props;

		this.escapeHit$.subscribe(() => edit!(''));

		setInterval(() => {
			if (this.scrolling) {
				this.scrolling = false;
				toggleInsertMenu!({ enabled: false });
			}
		}, 250);
	}

	componentWillUpdate(newProps: INoteViewerComponentProps) {
		const { note } = this.props;

		if ((!!newProps.note && !!note) && newProps.note.internalRef !== note.internalRef) {
			try {
				this.viewerDiv.scrollTo(0, 0);
			} catch (e) {
				console.warn(`This browser doesn't support element.scrollTo`);
			}
		}

		if (!newProps.isLoading && (!note || note.elements.length > 0) && !!newProps.note && newProps.note.elements.length === 0) {
			Materialize.toast('Welcome to your note! Press anywhere on the white area to insert an element.', 8000);
		}
	}

	private handleEmptyClick = (event) => {
		const { note, edit, elementEditing, theme, toggleInsertMenu, isNotepadOpen, isFullscreen, makeQuickNotepad, makeQuickNote, deleteNotepad } = this.props;
		if ((event.target !== this.viewerDiv && event.target !== this.containerDiv)) return;

		if (!note) {
			if (isNotepadOpen) {
				// Flash the Notepad Explorer amber
				const explorer = document.getElementById('notepad-explorer')!;
				explorer.style.backgroundColor = theme.accent;
				setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);

				// Create a quick note
				if (!!makeQuickNote) makeQuickNote();
			} else {
				// Flash notepads drop-down
				const explorer = document.getElementById('notepad-dropdown')!;
				explorer.style.backgroundColor = theme.accent;
				setTimeout(() => explorer.style.backgroundColor = null, 150);

				// Create quick notepad
				if (!!makeQuickNotepad) makeQuickNotepad();

				const guid = TOAST_HANDLER.register(() => deleteNotepad!());
				Materialize.toast(`Created notebook <a class="btn-flat amber-text" style="font-weight: 500;" href="#!" onclick="window.toastEvent('${guid}');">UNDO</a>`, 6000);
			}

			return;
		}

		if (elementEditing.length === 0) {
			// Insert a new element
			toggleInsertMenu!({
				x: event.clientX,
				y: event.clientY - FullScreenService.getOffset(isFullscreen)
			});
		} else {
			edit!('');
		}
	}

	private handleFileDrop = (event: DragEvent) => {
		event.preventDefault();

		const { note, isFullscreen } = this.props;
		if (!note) return;

		const x = event.clientX;
		const y = event.clientY - FullScreenService.getOffset(isFullscreen);

		if (!!event.dataTransfer && !!event.dataTransfer.items) {
			Array.from(event.dataTransfer.items)
				.filter(item => item.kind === 'file')
				.map(file => file.getAsFile())
				.filter(file => !!file)
				.forEach((file: File) => this.insertFileFromDrag(file, x, y));

			event.dataTransfer.items.clear();
		} else if (!!event.dataTransfer && !!event.dataTransfer.files) {
			Array.from(event.dataTransfer.files)
				.forEach(file => this.insertFileFromDrag(file, x, y));

			event.dataTransfer.clearData();
		}
	}

	private insertFileFromDrag = (file: File, x: number, y: number) => {
		const { insert, note, isFullscreen, updateElement } = this.props;
		if (!insert || !note || !updateElement) return;

		const insertX = Math.abs(Math.floor(this.containerDiv.getBoundingClientRect().left)) + x;
		const insertY = (Math.abs(Math.floor(this.containerDiv.getBoundingClientRect().top)) + y) - FullScreenService.getOffset(isFullscreen);

		const ext = file.name.split('.').pop()!;
		const type = ['png', 'jpeg', 'jpg', 'gif'].includes(ext) ? 'image' : 'file';

		const id = type + note.elements.filter(e => e.type === type).length + 1;
		const element: NoteElement = {
			type,
			content: 'AS',
			args: {
				id,
				x: insertX + 'px',
				y: insertY + 'px',
				width: 'auto',
				height: 'auto',
				ext: generateGuid(),
				filename: file.name
			}
		};

		insert(element);
		updateElement(id, element, file);
	}
}
