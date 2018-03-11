import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Converter, ConverterOptions, extension } from 'showdown';
import { NoteElement } from '../../../types/NotepadTypes';

interface IMarkdownViewMessage {
	type: string;
	id: string;
	payload?: any;
}

interface IShowdownOpts extends ConverterOptions {
	emoji: boolean;
}

export default class MarkdownElementComponent extends React.Component<INoteElementComponentProps> {
	private iframe: HTMLIFrameElement;
	private converter: Converter;

	constructor(props: INoteElementComponentProps, state: object) {
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
			extensions: ['maths', 'quick-maths']
		} as IShowdownOpts);
	}

	render() {
		const { element } = this.props;

		const iframeStyle = {
			borderStyle: 'none',
			width: '100%',
			height: element.args.height
		};

		return (
			<iframe style={iframeStyle} ref={iframe => this.iframe = iframe!} src={`/markdown-viewer.html?id=${element.args.id}`} sandbox="allow-scripts" />
		);
	}

	componentWillReceiveProps(nextProps: INoteElementComponentProps) {
		const { element } = nextProps;

		this.generateHtml(element)
			.then(html =>
				this.iframe.onload = () => {
					this.sendMessage({
						type: 'render',
						id: element.args.id,
						payload: {
							...element,
							content: html
						}
					});
				}
			);
	}

	componentDidMount() {
		this.componentWillReceiveProps(this.props);
		window.addEventListener('message', this.handleMessages);
	}

	componentWillUnmount() {
		window.removeEventListener('message', this.handleMessages);
		this.iframe.src = 'about:blank';
	}

	shouldComponentUpdate() {
		return false;
	}

	private generateHtml = (element: NoteElement): Promise<string> => {
		return new Promise<string>(resolve => {
			let html = this.converter.makeHtml(element.content);
			resolve(html);
		});
	}

	private handleMessages = event => {
		const { element } = this.props;
		const message: IMarkdownViewMessage = event.data;
		if (message.id !== element.args.id) return;

		switch (message.type) {
			case 'resize':
				this.iframe.style.width = message.payload.width;
				this.iframe.style.height = message.payload.height;
				break;

			default:
				break;
		}
	}

	private sendMessage = (message: IMarkdownViewMessage) => {
		this.iframe.contentWindow.postMessage(message, '*');
	}

	private configureExtensions = () => {
		extension('maths', function() {
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

		extension('quick-maths', function() {
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
	}
}
