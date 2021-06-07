// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '!raw-loader!../assets/Help.npx';

import * as React from 'react';
import { Converter, extension } from 'showdown';
import { IShowdownOpts } from './note-viewer/elements/markdown/MarkdownElementComponent';
import { Modal } from 'react-materialize';
import Async, { Props as AsyncProps } from 'react-promise';
import { Translators } from 'upad-parse';
import { colourTransformer, fendTransformer } from './note-viewer/elements/markdown/MarkdownTransformers';
import { DEFAULT_MODAL_OPTIONS } from '../util';

const ModalAsync = Async as { new (props: AsyncProps<WhatsNewNote>): Async<WhatsNewNote> };

type WhatsNewNote = {
	title: string;
	html: string;
};

export default class WhatsNewModalComponent extends React.Component {
	render() {
		/* eslint-disable jsx-a11y/anchor-has-content */
		return (
			<ModalAsync promise={this.getHtml()} then={note =>
				<Modal
					trigger={<a id="whats-new-modal-trigger" href="#!" />}
					fixedFooter={true}
					header={note.title}
					options={DEFAULT_MODAL_OPTIONS}>
					<div id="markdown-help" dangerouslySetInnerHTML={{
						__html: note.html
					}} />
				</Modal>
			} />
		);
	}

	private getHtml: () => Promise<WhatsNewNote> = async () => {
		const whatsNewNote = (await Translators.Xml.toNotepadFromNpx(helpNpx)).sections[0].notes[2];

		extension('colour', colourTransformer);

		extension('fend', fendTransformer);

		const html = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true,
			extensions: ['colour', 'fend']
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
