import * as React from 'react';
import { INoteElementComponentProps } from '../NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import { MarkDownViewer } from './MarkdownViewerHtml';
import { IAppWindow, UNSUPPORTED_MESSAGE } from '../../../../types';
import { enableTabs } from './enable-tabs';
import TodoListComponent from './TodoListComponent';
import { debounce } from '../../../../util';
import { Col, Input, Row } from 'react-materialize';
import MarkdownHelpComponent from './MarkdownHelpComponent';
import Resizable from 're-resizable';
import { Dialog } from '../../../../dialogs';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../../../types/Themes';
import Twemoji from 'twemoji/2/twemoji.amd';

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
	private iframe: HTMLIFrameElement;
	private editBox: HTMLTextAreaElement;
	private converter: Converter;
	private readonly updateWithDebounce: (element: NoteElement) => void;

	constructor(props: IMarkdownElementComponentProps, state: object) {
		super(props, state);

		this.configureExtensions();
		this.converter = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true,
			extensions: ['maths', 'quick-maths', 'graphs', 'hashtags', 'colour']
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

		return (
			<Resizable
				style={{overflow: 'hidden'}}
				size={{ width: element.args.width!, height: element.args.height! }}
				minWidth={(isEditing) ? 300 : 170}
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
				<TodoListComponent html={this.generateHtml(element)} toggle={() => this.sendMessage({
					id: element.args.id,
					type: 'toggle',
					payload: {}
				})} />

				{
					isEditing &&
					<Row style={{ marginBottom: 0, color: theme.text }}>
						<Col s={6}>
							<Input
								label="Font Size"
								defaultValue={element.args.fontSize}
								onChange={this.onFontSizeEdit}
							/>
						</Col>

						<Col s={6}>
							<Input
								style={{ width: '100%', color: theme.text }}
								label="Width"
								defaultValue={element.args.width}
								onChange={(e, v) => this.onSizeEdit('width', v)}
							/>
						</Col>
					</Row>
				}

				{isEditing && <span id="markdown-editor-label" style={{ color: theme.text }}>Markdown Editor (<MarkdownHelpComponent />)</span>}

				<div>
					{
						!isEditing
						&& <iframe
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
									height: '400px',
									backgroundColor: theme.background,
									color: theme.text,
									maxWidth: '100%',
									minWidth: (element.args.width !== 'auto') ? '100%' : '400px'
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
				this.generateHtml(element)
					.then(html => {
						this.sendMessage({
							type: 'render',
							id: element.args.id,
							payload: {
								...element,
								content: html,
								isPrinting
							}
						});
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

		this.generateHtml(newElement)
			.then(html => {
				this.sendMessage({
					type: 'render',
					id: element.args.id,
					payload: {
						...newElement,
						content: html
					}
				});
			});
	}

	private generateHtml = (element: NoteElement): Promise<string> => {
		return new Promise<string>(resolve => {
			let html = this.converter.makeHtml(element.content);
			if (navigator.onLine || (window as IAppWindow).isElectron) html = Twemoji.parse(html, icon => require(`twemoji/2/svg/${icon}.svg`));
			resolve(html);
		});
	}

	private handleMessages = event => {
		const { element, search, edit, onReady } = this.props;
		const message: IMarkdownViewMessage = event.data;
		if (message.id !== element.args.id) return;

		switch (message.type) {
			case 'resize':
				this.iframe.style.width = message.payload.width;
				this.iframe.style.height = message.payload.height;
				break;

			case 'hashtag':
				search(message.payload);
				(document.querySelector(`#search-button > a`)! as HTMLAnchorElement).click();
				break;

			case 'link':
				const newWindow = window.open(message.payload, '_blank');
				if (!!newWindow) {
					newWindow.opener = null;
					newWindow.focus();
				} else {
					if (!(window as IAppWindow).isElectron) Dialog.alert('Your browser blocked opening the link');
				}
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
					regex: /===([^]+?)===/gi,
					replace: function(s: string, match: number) {
						matches.push('===' + match + '===');
						let n = matches.length - 1;
						return '%ASCIIMATHPLACEHOLDER1' + n + 'ENDASCIIMATHPLACEHOLDER1%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (let i = 0; i < matches.length; ++i) {
							let pat = '%ASCIIMATHPLACEHOLDER1' + i + 'ENDASCIIMATHPLACEHOLDER1%';
							text = text.replace(new RegExp(pat, 'gi'), matches[i]);
						}
						// reset array
						matches = [];
						return text;
					}
				}
			];
		});

		extension('quick-maths', () => {
			let matches: string[] = [];
			return [
				{
					type: 'lang',
					regex: /''([^]+?)''/gi,
					replace: function(s: string, match: number) {
						matches.push(`''${match}''`);
						let n = matches.length - 1;
						return '%PLACEHOLDER4' + n + 'ENDPLACEHOLDER4%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (let i = 0; i < matches.length; ++i) {
							let pat = '%PLACEHOLDER4' + i + 'ENDPLACEHOLDER4%';
							text = text.replace(new RegExp(pat, 'gi'), matches[i]);
						}
						// reset array
						matches = [];
						return text;
					}
				}
			];
		});

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
						matches.push(`<a href="javascript:void(0);" onclick="searchHashtag(\'#${s.split('#')[1]}\');">${s}</a>`);
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

		extension('colour', {
			type: 'listener',
			listeners: {
				'images.after': (event, text: string) =>
					text.replace(/c\[([^\]]+)]\(([^)]+)\)/gi, (match, content, colour) =>
						`<span style="color: ${colour}">${content}</span>`
					)
			}
		} as any);
	}
}
