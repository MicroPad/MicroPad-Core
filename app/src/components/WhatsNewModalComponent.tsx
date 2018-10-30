// @ts-ignore
import helpNpx from '!raw-loader!../assets/Help.npx';

import * as React from 'react';
import { Converter, extension } from 'showdown';
import { IShowdownOpts } from './note-viewer/elements/markdown/MarkdownElementComponent';
import { Modal } from 'react-materialize';
import Async, { Props as AsyncProps } from 'react-promise';
import { Translators } from 'upad-parse';

const ModalAsync = Async as { new (props: AsyncProps<WhatsNewNote>): Async<WhatsNewNote> };

type WhatsNewNote = {
	title: string;
	html: string;
};

export default class WhatsNewModalComponent extends React.Component {
	render() {
		return (
			<ModalAsync promise={this.getHtml()} then={note =>
				<Modal
					trigger={<a id="whats-new-modal-trigger" href="#!" />}
					fixedFooter={true}
					header={note.title}>
					<div id="markdown-help" dangerouslySetInnerHTML={{
						__html: note.html
					}} />
				</Modal>
			} />
		);
	}

	private getHtml: () => Promise<WhatsNewNote> = async () => {
		const whatsNewNote = (await Translators.Xml.toNotepadFromNpx(helpNpx)).sections[0].notes[2];

		extension('colour', {
			type: 'listener',
			listeners: {
				'images.after': (event, text: string) =>
					text.replace(/c\[([^\]]+)]\(([^)]+)\)/gi, (match, content, colour) =>
						`<span style="color: ${colour}">${content}</span>`
					)
			}
		} as any);

		const html = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true,
			extensions: ['colour']
		} as IShowdownOpts)
			.makeHtml(whatsNewNote.elements[0].content)
			.split('<ul>').join('<ul class="browser-default">')
			.split('<li>').join('<li class="browser-default">')
			.split('<a').join('<a target="_blank" rel="nofollow noreferrer"');

		return {
			title: whatsNewNote.title,
			html: html
		};
	}
}
