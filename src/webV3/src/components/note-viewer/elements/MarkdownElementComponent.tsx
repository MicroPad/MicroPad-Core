import * as React from 'react';
import { INoteElementComponentProps } from './NoteElementComponent';

interface IMarkdownViewMessage {
	type: string;
	payload?: any;
}

export default class MarkdownElementComponent extends React.Component<INoteElementComponentProps> {
	private iframe: HTMLIFrameElement;

	render() {
		const { element } = this.props;
		console.log(element.args.height);

		const iframeStyle = {
			borderStyle: 'none',
			width: '100%',
			height: element.args.height
		};

		return (
			<iframe style={iframeStyle} ref={iframe => this.iframe = iframe!} src="/markdown-viewer.html" sandbox="allow-scripts" />
		);
	}

	componentWillReceiveProps(nextProps: INoteElementComponentProps) {
		const { element } = nextProps;

		this.iframe.onload = () => {
			this.sendMessage({
				type: 'render',
				payload: element
			});
		};
	}

	componentDidMount() {
		this.componentWillReceiveProps(this.props);
		window.addEventListener('message', this.handleMessages);
		{/*<div style={{padding: '5px', height: element.args.height}}>{element.content}</div>*/}
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

		switch (message.type) {
			case 'resize':
				this.iframe.style.height = parseInt(message.payload, 10) + 15 + 'px';
				break;

			default:
				break;
		}
	}

	private sendMessage = (message: IMarkdownViewMessage) => {
		this.iframe.contentWindow.postMessage(message, '*');
	}
}
