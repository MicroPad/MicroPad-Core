// @ts-expect-error
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '../../../../assets/Help.npx';

import './MarkdownElementComponent.css';
import React from 'react';
import { INoteElementComponentProps } from '../NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import * as MarkDownViewer from './MarkdownViewerHtml';
import { UNSUPPORTED_MESSAGE } from '../../../../types';
import { enableTabs } from './enable-tabs';
import TodoListComponent, { IProgressValues } from './TodoListComponent';
import { Checkbox, Col, Row, TextInput } from 'react-materialize';
import { Resizable } from 're-resizable';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../../../types/Themes';
import { colourTransformer, fendTransformer, mathsTransformer } from './MarkdownTransformers';
import NoteElementModalComponent from '../../../note-element-modal/NoteElementModalComponent';
import { BehaviorSubject } from 'rxjs';
import { ConnectedProps } from 'react-redux';
import { markdownElementConnector } from './MarkdownElementContainer';
import Button2 from '../../../Button';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export interface IMarkdownElementComponentProps extends INoteElementComponentProps {
	search: (query: string) => void;
	theme: ITheme;
	isPrinting?: boolean;
	onReady?: () => void;
}

export interface IMarkdownViewMessage {
	type: string;
	id: string;
	payload?: any;
}

export interface IShowdownOpts extends ConverterOptions {
	emoji: boolean;
}

type Props = ConnectedProps<typeof markdownElementConnector> & IMarkdownElementComponentProps;

const converter = configureShowdown();

// @ts-expect-error TS2339
// eslint-disable-next-line no-restricted-globals
self.MonacoEnvironment = {
	getWorkerUrl: (moduleId, label) => build.defs.MONACO_WORKER_PATH
}
loader.config({ monaco });

export default class MarkdownElementComponent extends React.Component<Props> {
	private iframe: HTMLIFrameElement | undefined;
	private readonly progress$: BehaviorSubject<IProgressValues> = new BehaviorSubject<IProgressValues>({ done: 0, total: 0 });

	render() {
		const { element, elementEditing, theme } = this.props;

		const iframeStyle = {
			borderStyle: 'none',
			width: '100%',
			height: element.args.height
		};

		const isEditing = elementEditing === element.args.id;

		const numericSizes = {
			width: parseInt(element.args.width || '', 10),
			height: parseInt(element.args.height || '', 10)
		};

		if (isNaN(numericSizes.width)) numericSizes.width = -1;
		if (isNaN(numericSizes.height)) numericSizes.height = -1;

		const minWidth = isEditing ? Math.max(400, numericSizes.width) : 170;
		const width = isEditing ? 'auto' : element.args.width!;
		const height = isEditing ? 'auto' : element.args.height!;

		const shouldUseCodeEditor = isEditing && !this.props.shouldSpellCheck;

		return (
			<Resizable
				style={{ overflow: 'hidden' }}
				size={{ width, height }}
				minWidth={minWidth}
				enable={{
					top: false,
					bottom: false,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
					right: !isEditing
				}}
				onResizeStop={(e, d, ref) => {
					this.onSizeEdit('width', ref.style.width!);
				}}>
				{isEditing || <TodoListComponent progress$={this.progress$} toggle={() => this.sendMessage({
					id: element.args.id,
					type: 'toggle',
					payload: {}
				})} />}

				{
					isEditing &&
					<Row style={{ marginBottom: 0, color: theme.text }}>
						<Col s={4}>
							<TextInput
								inputClassName="markdown-element__options-input"
								label="Font Size"
								defaultValue={element.args.fontSize}
								onChange={this.onFontSizeEdit}
							/>
						</Col>
						<Col s={4}>
							<TextInput
								inputClassName="markdown-element__options-input"
								label="Width"
								defaultValue={element.args.width}
								onChange={e => this.onSizeEdit('width', e.target.value)}
							/>
						</Col>
						<Col s={3}>
							<Row style={{ marginBottom: 0, color: theme.text }}>
								<Col s={12}>
									<Checkbox
										label="Spellcheck"
										value="1"
										checked={this.props.shouldSpellCheck}
										onChange={() => this.props.toggleSpellCheck()}
										filledIn
									/>
								</Col>
								<Col s={12}>
									<Checkbox
										label="Word Wrap"
										value="1"
										checked={this.props.shouldWordWrap}
										onChange={() => this.props.toggleWordWrap()}
										filledIn
									/>
								</Col>
							</Row>
						</Col>
					</Row>
				}

				{isEditing && <span id="markdown-editor-label" style={{ color: theme.text }}>
					Markdown Editor (<NoteElementModalComponent
					id={`formatting-help-modal-${element.args.id}`}
					trigger={<Button2 flat small waves="light" style={{ padding: '0' }}>Formatting Help</Button2>}
					npx={helpNpx}
					findNote={np => np.sections[1].notes[0]} />)
				</span>}

				<React.Fragment>
					{
						!isEditing
						&& <iframe
							title="Markdown element's contents"
							id={`${element.args.id}-iframe`}
							style={iframeStyle}
							ref={iframe => this.iframe = iframe!}
							srcDoc={MarkDownViewer.getHtml(element.args.id, theme, element.args.fontSize)}
							sandbox="allow-scripts allow-popups" />
					}

					{
						isEditing && !shouldUseCodeEditor &&
						<textarea
							style={
								{
									minWidth,
									height: '400px',
									backgroundColor: theme.background,
									color: theme.text,
									whiteSpace: this.props.shouldWordWrap ? 'break-spaces' : 'pre',
									overflowWrap: 'normal',
									overflowX: 'auto'
								}
							}
							placeholder="Text (in Markdown)"
							value={element.content}
							onChange={this.onElementEdit}
							onKeyDown={e => enableTabs(e.target as HTMLTextAreaElement, e)}
							spellCheck={this.props.shouldSpellCheck}
							autoFocus={true} />
					}

					{
						shouldUseCodeEditor &&
						<div className="markdown-element__code-editor" style={{ minWidth }}>
							<Editor
								language="markdown"
								value={element.content}
								onChange={newContent => this.onElementEdit({ target: { value: newContent } })}
								theme="micropad"
								options={{
									automaticLayout: true,
									minimap: { enabled: false },
									wordWrap: this.props.shouldWordWrap ? 'on' : 'off',
									wrappingIndent: 'same',
									wrappingStrategy: 'advanced',
									lineNumbers: 'off'
								}} />
						</div>
					}
				</React.Fragment>
			</Resizable>
		);
	}

	componentDidUpdate(props: IMarkdownElementComponentProps) {
		const { element, isPrinting } = props;

		if (!!this.iframe) {
			this.iframe.onload = () => {
				const html = this.generateHtml(element);
				this.sendMessage({
					type: 'render',
					id: element.args.id,
					payload: {
						...element,
						content: html,
						isPrinting
					}
				});
			};
		}
	}

	componentDidMount() {
		this.componentDidUpdate(this.props);
		window.addEventListener('message', this.handleMessages);
	}

	componentWillUnmount() {
		window.removeEventListener('message', this.handleMessages);

		if (!this.iframe) return;
		this.iframe.src = 'about:blank';
	}

	private onElementEdit = (event) => {
		const { element } = this.props;

		this.props.updateElement!(element.args.id, {
			...element,
			content: event.target.value
		});
	}

	private onFontSizeEdit = (event) => {
		const { element } = this.props;

		this.props.updateElement!(element.args.id, {
			...element,
			args: {
				...element.args,
				fontSize: event.target.value
			}
		});
	}

	private onSizeEdit = (type: 'width' | 'height', value: string) => {
		const { element, updateElement } = this.props;

		const newElement: NoteElement = {
			...element,
			args: {
				...element.args,
				[type]: value
			}
		};

		updateElement!(element.args.id, newElement);

		this.sendMessage({
			type: 'render',
			id: element.args.id,
			payload: {
				...newElement,
				content: this.generateHtml(newElement)
			}
		});
	}

	private generateHtml = (element: NoteElement): string => {
		const rawHtml = converter.makeHtml(element.content);
		const res = this.props.enableCheckboxes(element.content, rawHtml);
		this.progress$.next(res);
		return res.html;
	}

	private handleMessages = event => {
		const { element, search, edit, onReady } = this.props;
		const message: IMarkdownViewMessage = event.data;
		if (message.id !== element.args.id) return;

		switch (message.type) {
			case 'resize':
				if (!this.iframe) return;
				this.iframe.style.width = message.payload.width;
				this.iframe.style.height = message.payload.height;
				break;

			case 'hashtag':
				search(message.payload);
				this.props.openModal('search-modal');
				break;

			case 'link':
				// this returns null due to the 'noopener' argument
				(() => {
					const isSafariLike = navigator.vendor === 'Apple Computer, Inc.';
					const url = message.payload;
					if (isSafariLike) {
						// Safari currently opens links in a new window if noopener/noreferrer are set
						// eslint-disable-next-line no-script-url
						if (url.startsWith('javascript:') || url.startsWith('vbscript:') || url.startsWith('data:')) {
							window.open('about:blank', '_blank');
						} else {
							window.open(url, '_blank');
						}
					} else {
						window.open(url, '_blank', 'noopener,noreferrer');
					}
				})();
				break;

			case 'edit':
				edit(element.args.id);
				break;

			case 'ready':
				if (!!onReady) onReady();
				break;

			case 'toggle_checkbox':
				(() => {
					const newElement = {
						...element,
						content: this.props.toggleMdCheckbox(element.content, message.payload)
					};
					this.props.updateElement!(element.args.id, newElement);
					this.sendMessage({
						type: 'render',
						id: element.args.id,
						payload: {
							...element,
							content: this.generateHtml(newElement)
						}
					});
				})();
				break;

			default:
				break;
		}
	}

	private sendMessage = (message: IMarkdownViewMessage) => {
		if (!this.iframe) return;
		this.iframe.contentWindow!.postMessage(message, '*');
	}
}

function configureShowdown(): Converter {
	extension('maths', mathsTransformer);

	extension('fend', fendTransformer);

	extension('graphs', () => {
		let matches: string[] = [];
		return [
			{
				type: 'listener',
				listeners: {
					'hashHTMLBlocks.after': (evtName, text) => {
						let i = 0;
						return text.replaceAll(/(=-=([^]+?)=-=)|(!!\(([^]+?)\))/gi, match => {
							matches.push(`<em title="${UNSUPPORTED_MESSAGE}">Unsupported Content</em> &#x1F622`);
							return '%PLACEHOLDER2' + i++ + 'ENDPLACEHOLDER2%';
						});
					}
				}
			},
			{
				type: 'output',
				filter: function(text: string) {
					for (let i = 0; i < matches.length; ++i) {
						const pat = '%PLACEHOLDER2' + i + 'ENDPLACEHOLDER2%';
						text = text.replace(new RegExp(pat, 'gi'), matches[i]);
					}
					// reset array
					matches = [];
					return text;
				}
			}
		];
	});

	extension('hashtags', () => {
		let matches: string[] = [];
		return [
			{
				type: 'listener',
				listeners: {
					'hashHTMLBlocks.after': (evtName, text) => {
						let i = 0;
						return text.replaceAll(/(^|\s)(#[a-z\d-]+)/gi, (match, whitespace) => {
							matches.push(`<a href="javascript:void(0);" onclick="searchHashtag('#${match.split('#')[1]}');">${match}</a>`);
							return whitespace + '%PLACEHOLDER3' + i++ + 'ENDPLACEHOLDER3%';
						});
					}
				}
			},
			{
				type: 'output',
				filter: function(text: string) {
					for (let i = 0; i < matches.length; ++i) {
						const pat = '%PLACEHOLDER3' + i + 'ENDPLACEHOLDER3%';
						text = text.replace(new RegExp(pat, 'gi'), matches[i]);
					}
					// reset array
					matches = [];
					return text;
				}
			}
		];
	});

	extension('colour', colourTransformer);

	return new Converter({
		parseImgDimensions: true,
		simplifiedAutoLink: true,
		strikethrough: true,
		tables: true,
		tasklists: true,
		noHeaderId: true,
		emoji: true,
		extensions: ['maths', 'fend', 'graphs', 'hashtags', 'colour']
	} as IShowdownOpts);
}
