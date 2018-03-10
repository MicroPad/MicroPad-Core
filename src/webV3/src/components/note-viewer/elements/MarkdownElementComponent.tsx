import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';
import { Converter, ConverterOptions } from 'showdown';

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

		this.converter = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true
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

		this.iframe.onload = () => {
			this.sendMessage({
				type: 'render',
				id: element.args.id,
				payload: {
					...element,
					content: this.converter.makeHtml(element.content)
				}
			});
		};
	}

	componentDidMount() {
		this.componentWillReceiveProps(this.props);
		window.addEventListener('message', this.handleMessages);
	}

	componentWillUnmount() {
		window.removeEventListener('message', this.handleMessages);
	}

	shouldComponentUpdate() {
		return false;
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
}
