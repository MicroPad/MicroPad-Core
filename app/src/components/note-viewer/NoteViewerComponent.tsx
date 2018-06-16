import * as React from 'react';
import './NoteViewerComponent.css';
import { INote, NoteElement } from '../../types/NotepadTypes';
import NoteElementComponent from './elements/NoteElementComponent';
import * as Materialize from 'materialize-css/dist/js/materialize.js';
import { ProgressBar } from 'react-materialize';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { IInsertElementState } from '../../reducers/NoteReducer';
import ZoomComponent from '../../containers/ZoomContainer';

export interface INoteViewerComponentProps {
	isLoading: boolean;
	isFullscreen: boolean;
	zoom: number;
	note?: INote;
	elementEditing: string;
	noteAssets: object;
	isNotepadOpen: boolean;
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
			edit,
			updateElement,
			deleteElement,
			toggleInsertMenu
		} = this.props;

		const classes: string = (!note || note.elements.length === 0) ? 'empty' : '';
		let styles = {};

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
				className={classes}
				style={styles}
				ref={div => this.viewerDiv = div!}
				onClick={this.handleEmptyClick}
				onScroll={() => toggleInsertMenu!({ enabled: false })}>

				{isLoading && <div id="progress-bar"><ProgressBar className="amber" /></div>}
				<div id="note-container" style={containerStyles} ref={div => this.containerDiv = div!}>
					{elements}
				</div>
				{!!note && isFullscreen && <ZoomComponent />}
			</div>
		);
	}

	componentDidMount() {
		const { edit } = this.props;

		this.escapeHit$.subscribe(() => edit!(''));
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
		const { note, edit, elementEditing, toggleInsertMenu, isNotepadOpen } = this.props;
		if ((event.target !== this.viewerDiv && event.target !== this.containerDiv)) return;

		if (!note) {
			if (isNotepadOpen) {
				// Flash the Notepad Explorer amber
				const explorer = document.getElementById('notepad-explorer')!;
				explorer.style.backgroundColor = '#ffb300';
				setTimeout(() => explorer.style.backgroundColor = '#607d8b', 100);
			} else {
				// Flash notepads drop-down
				const explorer = document.getElementById('notepad-dropdown')!;
				explorer.style.backgroundColor = '#ffb300';
				setTimeout(() => explorer.style.backgroundColor = '#607d8b', 100);
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
