import * as React from 'react';
import { CSSProperties } from 'react';
import './NoteViewerComponent.css';
import NoteElementComponent from './elements/NoteElementComponent';
import * as Materialize from 'materialize-css/dist/js/materialize.js';
import { ProgressBar } from 'react-materialize';
import { filter, map } from 'rxjs/operators';
import { fromEvent, Observable } from 'rxjs';
import { IInsertElementState } from '../../reducers/NoteReducer';
import ZoomComponent from '../../containers/ZoomContainer';
import { Note } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../types/Themes';

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
	deleteElement?: (id: string) => void;
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
			edit,
			updateElement,
			deleteElement,
			toggleInsertMenu
		} = this.props;

		let styles: CSSProperties = {
			backgroundImage: (!note || note.elements.length === 0) ? `url(${theme.backgroundImage})` : undefined,
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
				elementEditing={elementEditing} />
		));

		if (!isLoading && !!note && elements.length === 0) Materialize.toast('Welcome to your note! Press anywhere on the white area to insert an element.', 8000);

		return (
			<div
				id="note-viewer"
				style={styles}
				ref={div => this.viewerDiv = div!}
				onClick={this.handleEmptyClick}
				onScroll={() => this.scrolling = true}>

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
	}

	private handleEmptyClick = (event) => {
		const { note, edit, elementEditing, theme, toggleInsertMenu, isNotepadOpen } = this.props;
		if ((event.target !== this.viewerDiv && event.target !== this.containerDiv)) return;

		if (!note) {
			if (isNotepadOpen) {
				// Flash the Notepad Explorer amber
				const explorer = document.getElementById('notepad-explorer')!;
				explorer.style.backgroundColor = theme.accent;
				setTimeout(() => explorer.style.backgroundColor = theme.chrome, 150);
			} else {
				// Flash notepads drop-down
				const explorer = document.getElementById('notepad-dropdown')!;
				explorer.style.backgroundColor = theme.accent;
				setTimeout(() => explorer.style.backgroundColor = null, 150);
			}

			return;
		}

		if (elementEditing.length === 0) {
			// Insert a new element
			toggleInsertMenu!({
				x: event.clientX,
				y: event.clientY - 128
			});
		} else {
			edit!('');
		}
	}
}
