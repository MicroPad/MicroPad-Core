import React from 'react';
import { Icon } from 'react-materialize';
import './RecordingElementComponent.css';
import { IFileElementComponent } from './FileElementComponent';
import { BAD_BROWSER_AUDIO } from '../../../types';
import Recorder from 'opus-recorder';
import Button2 from '../../Button';

export default class RecordingElementComponent extends React.Component<IFileElementComponent> {
	private readonly recorder;
	private readonly canRecord: boolean = true;

	private buttonContainer!: HTMLDivElement;

	constructor(props: IFileElementComponent) {
		super(props);

		this.canRecord = Recorder.isRecordingSupported();
		try {
			this.recorder = new Recorder({
				encoderPath: '/assets/recorder/encoderWorker.min.js'
			});
		} catch (err) {
			console.warn('Recording is not supported');
			this.canRecord = false;
		}
	}

	render() {
		const { element, noteAssets, elementEditing } = this.props;
		const isEditing = elementEditing === element.args.id;
		const hasAsset = !!element.args.filename && !!element.args.ext && !!noteAssets[element.args.ext];

		if (isEditing && !this.canRecord) return <div style={{ padding: '5px', width: '400px' }}><p>Recording is not supported</p></div>;

		return (
			<div style={{ padding: '5px', width: (!isEditing) ? 'max-content' : '400px' }}>
				{
					isEditing
					&& <div ref={e => this.buttonContainer = e!} className="recording-inactive">
						<Button2 className="accent-btn" waves="light" onClick={() => this.recorder.start()}><Icon left={true}>record_voice_over</Icon> Start Recording</Button2>
						<Button2 className="red" waves="light" onClick={() => this.recorder.stop()}><Icon left={true}>stop</Icon> Stop Recording</Button2>
					</div>
				}

				{ !isEditing && !hasAsset && <em onClick={this.openEditor}>Tap here to start a recording…</em>}

				{
					!isEditing
					&& hasAsset
					&& <div onClick={this.openEditor}>
						<p>
							<a title={BAD_BROWSER_AUDIO} href={noteAssets[element.args.ext!]} download={element.args.filename} onClick={e => e.stopPropagation()}>
								<em>{element.args.filename}</em>
							</a>
						</p>
						<audio controls={true} src={noteAssets[element.args.ext!]} />
					</div>
				}
			</div>
		);
	}

	componentDidMount() {
		const { updateElement, element, edit } = this.props;

		this.recorder.onstart = () => {
			this.buttonContainer.classList.remove('recording-inactive');
			this.buttonContainer.classList.add('recording-active');
		};

		this.recorder.ondataavailable = (buffer: ArrayBuffer) => {
			this.buttonContainer.classList.add('recording-inactive');
			this.buttonContainer.classList.remove('recording-active');

			const data = new Blob([buffer], { type: 'audio/ogg' });
			updateElement!(element.args.id, {
				...element,
				args: {
					...element.args,
					filename: new Date().toISOString() + '.ogg'
				}
			}, data);
			edit('');
		};
	}

	componentDidUpdate() {
		this.recorder.stop();
	}

	shouldComponentUpdate() {
		return !this.buttonContainer || !this.buttonContainer.classList.contains('recording-active');
	}

	private openEditor = event => {
		const { element, edit } = this.props;

		const path = event.path || (event.composedPath && event.composedPath()) || [event.target];
		const tag = path[0].tagName.toLowerCase();
		if (tag === 'button' || tag === 'a' || tag === 'audio') return;

		edit(element.args.id);
	}
}
