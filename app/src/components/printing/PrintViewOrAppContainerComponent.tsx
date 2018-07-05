import * as React from 'react';
import './PrintViewComponent.css';
import MarkdownElementComponent from '../note-viewer/elements/markdown/MarkdownElementComponent';
import { noop } from 'rxjs/util/noop';
import { Note } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';

export interface IPrintViewComponentProps {
	note?: Note;
	printElement: NoteElement;
	clearPrintView: () => void;
}

export default class PrintViewOrAppContainerComponent extends React.Component<IPrintViewComponentProps> {
	render() {
		const { note, printElement } = this.props;
		if (!note || !printElement) return this.props.children;

		return (
			<div id="printed-elements">
				<em>{note.title}</em>
				<hr />
				<MarkdownElementComponent
					element={{
						...printElement,
						args: {
							...printElement.args,
							width: '180mm'
						}
					}}
					elementEditing=""
					noteAssets={{}}
					edit={noop}
					search={noop} />
			</div>
		);
	}

	componentDidUpdate() {
		const { printElement, clearPrintView } = this.props;
		if (!printElement) return;

		setTimeout(() => {
			window.print();
			clearPrintView();
		}, 500);
	}
}
