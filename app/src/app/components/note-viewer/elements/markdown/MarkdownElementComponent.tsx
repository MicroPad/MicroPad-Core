// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '!raw-loader!../../../../assets/Help.npx';

import './MarkdownElementComponent.css';
import * as React from 'react';
import { INoteElementComponentProps } from '../NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import * as MarkDownViewer from './MarkdownViewerHtml';
import { UNSUPPORTED_MESSAGE } from '../../../../types';
import { enableTabs } from './enable-tabs';
import TodoListComponent from './TodoListComponent';
import { debounce } from '../../../../util';
import { Button, Col, Row, TextInput } from 'react-materialize';
import { Resizable } from 're-resizable';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../../../types/Themes';
import { colourTransformer, fendTransformer } from './MarkdownTransformers';
import NoteElementModalComponent from '../../../note-element-modal/NoteElementModalComponent';
import { BehaviorSubject } from 'rxjs';

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

export default class MarkdownElementComponent extends React.Component<IMarkdownElementComponentProps> {
	private iframe: HTMLIFrameElement | undefined;
	private editBox: HTMLTextAreaElement | undefined;
	private converter: Converter;
	private readonly updateWithDebounce: (element: NoteElement) => void;
	private html$: BehaviorSubject<string> = new BehaviorSubject<string>('');

	constructor(props: IMarkdownElementComponentProps, state: object) {
		super(props, state);

		this.configureExtensions();
		this.converter = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			noHeaderId: true,
			emoji: true,
			extensions: ['maths', 'fend', 'graphs', 'hashtags', 'colour']
		} as IShowdownOpts);

		this.updateWithDebounce = this.createUpdateWithDebounce();
	}

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
				<TodoListComponent html$={this.html$} toggle={() => this.sendMessage({
					id: element.args.id,
					type: 'toggle',
					payload: {}
				})} />

				{
					isEditing &&
					<Row style={{ marginBottom: 0, color: theme.text }}>
						<Col s={6}>
							<TextInput
								inputClassName="markdown-element__options-input"
								label="Font Size"
								defaultValue={element.args.fontSize}
								onChange={this.onFontSizeEdit}
							/>
						</Col>
						<Col s={6}>
							<TextInput
								inputClassName="markdown-element__options-input"
								label="Width"
								defaultValue={element.args.width}
								onChange={e => this.onSizeEdit('width', e.target.value)}
							/>
						</Col>
					</Row>
				}

				{isEditing && <span id="markdown-editor-label" style={{ color: theme.text }}>
					Markdown Editor (<NoteElementModalComponent
						trigger={<Button flat small waves="light" style={{ padding: '0' }}>Formatting Help</Button>}
						npx={helpNpx}
						findNote={np => np.sections[1].notes[0]} />)
				</span>}

				<div>
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
						isEditing &&
						<textarea
							style={
								{
									minWidth,
									height: '400px',
									backgroundColor: theme.background,
									color: theme.text,
									whiteSpace: 'pre',
									overflowWrap: 'normal',
									overflowX: 'auto'
								}
							}
							ref={input => this.editBox = input!}
							placeholder="Text (in Markdown)"
							defaultValue={element.content}
							onChange={this.onElementEdit}
							autoFocus={true} />
					}
				</div>
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
		} else if (!!this.editBox) {
			this.editBox.onkeydown = enableTabs;
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

		const newElement: NoteElement = {
			...element,
			content: event.target.value
		};

		this.updateWithDebounce(newElement);
	}

	private onFontSizeEdit = (event) => {
		const { element } = this.props;

		const newElement: NoteElement = {
			...element,
			args: {
				...element.args,
				fontSize: event.target.value
			}
		};

		this.updateWithDebounce(newElement);
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
		const html = this.converter.makeHtml(element.content);
		this.html$.next(html);
		return html;
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
				(document.querySelector(`#search-button > a`)! as HTMLAnchorElement).click();
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

			default:
				break;
		}
	}

	private sendMessage = (message: IMarkdownViewMessage) => {
		if (!this.iframe) return;
		this.iframe.contentWindow!.postMessage(message, '*');
	}

	private createUpdateWithDebounce = () => {
		const { updateElement } = this.props;

		return debounce((element: NoteElement) => {
			updateElement!(element.args.id, element);
		}, 100);
	}

	private configureExtensions = () => {
		extension('maths', () => {
			let matches: string[] = [];
			return [
				{
					type: 'lang',
					regex: /(===[^]+?===|''[^]+?''|;;[^]+?;;)/gi,
					replace: function(s: string, match: string) {
						matches.push(match);
						let n = matches.length - 1;
						return '%MATHPLACEHOLDER' + n + 'ENDMATHPLACEHOLDER%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (let i = 0; i < matches.length; ++i) {
							let pat = '%MATHPLACEHOLDER' + i + 'ENDMATHPLACEHOLDER%';
							text = text.replace(new RegExp(pat, 'gi'), matches[i]);
						}
						// reset array
						matches = [];
						return text;
					}
				}
			];
		});

		extension('fend', fendTransformer);

		extension('graphs', () => {
			let matches: string[] = [];
			return [
				{
					type: 'lang',
					regex: /(=-=([^]+?)=-=)|(!!\(([^]+?)\))/gi,
					replace: function(s: string) {
						matches.push(`<em title="${UNSUPPORTED_MESSAGE}">Unsupported Content</em> &#x1F622`);
						let n = matches.length - 1;
						return '%PLACEHOLDER2' + n + 'ENDPLACEHOLDER2%';
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
					type: 'lang',
					regex: /(^|\s)(#[a-z\d-]+)/gi,
					replace: function(s: string) {
						matches.push(`<a href="javascript:void(0);" onclick="searchHashtag('#${s.split('#')[1]}');">${s}</a>`);
						const n = matches.length - 1;
						return '%PLACEHOLDER3' + n + 'ENDPLACEHOLDER3%';
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
	}
}
