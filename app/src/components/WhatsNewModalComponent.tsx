// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import * as React from 'react';
import { Converter } from 'showdown';
import * as Parser from 'upad-parse/dist/index';
import { INotepad } from '../types/NotepadTypes';
import { IShowdownOpts } from './note-viewer/elements/markdown/MarkdownElementComponent';
import { Modal } from 'react-materialize';

export default class WhatsNewModalComponent extends React.Component {
	render() {
		Parser.parse(helpNpx, ['asciimath']);
		const help: INotepad = Parser.notepad;
		const whatsNewNote = help.sections[0].notes[2];

		const html = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true
		} as IShowdownOpts).makeHtml(whatsNewNote.elements[0].content);

		return (
			<Modal
				trigger={<a id="whats-new-modal-trigger" href="#!" />}
				header={whatsNewNote.title}>
				<div id="markdown-help" dangerouslySetInnerHTML={{
					__html: html
						.split('<ul>').join('<ul class="browser-default">')
						.split('<li>').join('<li class="browser-default">')
						.split('<a').join('<a target="_blank" rel="nofollow noreferrer"')
				}} />
			</Modal>
		);
	}
}
