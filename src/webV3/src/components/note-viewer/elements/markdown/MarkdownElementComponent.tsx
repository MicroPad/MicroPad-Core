import * as React from 'react';
import { INoteElementComponentProps } from '../NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import { NoteElement } from '../../../../types/NotepadTypes';
import { MarkDownViewer } from './MarkdownViewerHtml';
import { UNSUPPORTED_MESSAGE } from '../../../../types/index';

export interface IMarkdownElementComponentProps extends INoteElementComponentProps {
	search: (query: string) => void;
}

interface IMarkdownViewMessage {
	type: string;
	id: string;
	payload?: any;
}

interface IShowdownOpts extends ConverterOptions {
	emoji: boolean;
}

export default class MarkdownElementComponent extends React.Component<IMarkdownElementComponentProps> {
	private iframe: HTMLIFrameElement;
	private converter: Converter;

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
			<div>
				{
					!isEditing
					&& <iframe
					style={iframeStyle}
					ref={iframe => this.iframe = iframe!}
					srcDoc={MarkDownViewer.getHtml(element.args.id)}
					sandbox="allow-scripts allow-popups" />
				}

				{isEditing && <textarea style={{height: '400px', backgroundColor: 'white'}} defaultValue={element.content} />}
			</div>
		);
	}

	componentDidUpdate(props: INoteElementComponentProps) {
		const { element } = props;

		if (!this.iframe) return;

		this.iframe.onload = () => {
			this.generateHtml(element)
				.then(html =>
					this.sendMessage({
						type: 'render',
						id: element.args.id,
						payload: {
							...element,
							content: html
						}
					})
				);
		};
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

	shouldComponentUpdate(nextProps: INoteElementComponentProps) {
		const { element, elementEditing } = nextProps;

		return (element.args.id === elementEditing || this.props.element.args.id === this.props.elementEditing);
	}

	private generateHtml = (element: NoteElement): Promise<string> => {
		return new Promise<string>(resolve => {
			let html = this.converter.makeHtml(element.content);
			resolve(html);
		});
	}

	private handleMessages = event => {
		const { element, search, edit } = this.props;
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
					alert('Your browser blocked opening the link');
				}
				break;

			case 'edit':
				edit(element.args.id);
				break;

			default:
				break;
		}
	}

	private sendMessage = (message: IMarkdownViewMessage) => {
		this.iframe.contentWindow.postMessage(message, '*');
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
						matches.push(`===${match}===`);
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
