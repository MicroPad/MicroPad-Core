import * as React from 'react';
import { INoteElementComponentProps } from '../NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import { NoteElement } from '../../../../types/NotepadTypes';
import { MarkDownViewer } from './MarkdownViewerHtml';
import { UNSUPPORTED_MESSAGE } from '../../../../types';
import { enableTabs } from './enable-tabs';
import TodoListComponent from './TodoListComponent';
import { debounce } from '../../../../util';
import { Col, Input, Row } from 'react-materialize';
import MarkdownHelpComponent from './MarkdownHelpComponent';
import Resizable from 're-resizable';
import { Dialog } from '../../../../dialogs';

export interface IMarkdownElementComponentProps extends INoteElementComponentProps {
	search: (query: string) => void;
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
			extensions: ['maths', 'quick-maths', 'graphs', 'hashtags']
		} as IShowdownOpts);

		this.updateWithDebounce = this.createUpdateWithDebounce();
	}

	render() {
		const { element, elementEditing } = this.props;

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
					<Row>
						<Col s={6}>
							<Input
								label="Font Size"
								defaultValue={element.args.fontSize}
								onChange={this.onFontSizeEdit}
							/>
						</Col>

						<Col s={6}>
							<Input
								style={{width: '100%'}}
								label="Width"
								defaultValue={element.args.width}
								onChange={(e, v) => this.onSizeEdit('width', v)}
							/>
						</Col>
					</Row>
				}

				{isEditing && <MarkdownHelpComponent />}

				<div>
					{
						!isEditing
						&& <iframe
							id={`${element.args.id}-iframe`}
							style={iframeStyle}
							ref={iframe => this.iframe = iframe!}
							srcDoc={MarkDownViewer.getHtml(element.args.id)}
							sandbox="allow-scripts allow-popups" />
					}

					{
						isEditing &&
						<textarea
							style={
								{
									height: '400px',
									backgroundColor: 'white',
									maxWidth: '100%',
									minWidth: (element.args.width !== 'auto') ? '100%' : '400px'
								}
							}
							ref={input => this.editBox = input!}
							placeholder="Text (in Markdown)"
							defaultValue={element.content}
							onChange={this.onElementEdit} />
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
				document.getElementById(`search-button`)!.click();
				break;

			case 'link':
				const newWindow = window.open(message.payload, '_blank');
				if (!!newWindow) {
					newWindow.opener = null;
					newWindow.focus();
				} else {
					if (!(window as any).isElectron) Dialog.alert('Your browser blocked opening the link');
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
					replace: function(s: string, match: string) {
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
					replace: function(s: string, match: string) {
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
					replace: function(s: string, match: string) {
						matches.push(`<em title="${UNSUPPORTED_MESSAGE}">Unsupported Content</em> &#x1F622`);
						var n = matches.length - 1;
						return '%PLACEHOLDER2' + n + 'ENDPLACEHOLDER2%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (var i = 0; i < matches.length; ++i) {
							var pat = '%PLACEHOLDER2' + i + 'ENDPLACEHOLDER2%';
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
					replace: function(s: string, match: string) {
						matches.push(`<a href="javascript:searchHashtag(\'#${s.split('#')[1]}\');">${s}</a>`);
						var n = matches.length - 1;
						return '%PLACEHOLDER3' + n + 'ENDPLACEHOLDER3%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (var i = 0; i < matches.length; ++i) {
							var pat = '%PLACEHOLDER3' + i + 'ENDPLACEHOLDER3%';
							text = text.replace(new RegExp(pat, 'gi'), matches[i]);
						}
						// reset array
						matches = [];
						return text;
					}
				}
			];
		});
	}
}
