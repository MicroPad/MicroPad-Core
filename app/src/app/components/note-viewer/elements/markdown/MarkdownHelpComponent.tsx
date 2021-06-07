// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import helpNpx from '!raw-loader!../../../../assets/Help.npx';

import * as React from 'react';
import { Modal } from 'react-materialize';
import { Converter, extension } from 'showdown';
import { IShowdownOpts } from './MarkdownElementComponent';
import './MarkdownHelpComponent.css';
import Async, { Props as AsyncProps } from 'react-promise';
import { Translators } from 'upad-parse/dist';
import { colourTransformer, fendTransformer } from './MarkdownTransformers';
import { DEFAULT_MODAL_OPTIONS } from '../../../../util';

const ModalAsync = Async as { new (props: AsyncProps<FormattingHelpNote>): Async<FormattingHelpNote> };

type FormattingHelpNote = {
	title: string;
	html: string;
};

export default class MarkdownHelpComponent extends React.Component {
	render() {
		return (
			<ModalAsync promise={this.getHtml()} then={note =>
				<Modal
					header={note.title}
					trigger={<a href="#!">Formatting Help</a>}
					fixedFooter={true}
					modalOptions={DEFAULT_MODAL_OPTIONS}>
					<div id="markdown-help" dangerouslySetInnerHTML={{
						__html: note.html

					}} />
				</Modal>
			} />
		);
	}

	private getHtml: () => Promise<FormattingHelpNote> = async () => {
		const mdGuideNote = (await Translators.Xml.toNotepadFromNpx(helpNpx)).sections[1].notes[0];

		extension('mock', () => {
			let matches: string[] = [];
			return [
				{
					type: 'lang',
					regex: /(===([^]+?)===|''([^]+?)''|;;([^]+?);;)/gi,
					replace: function(s: string, match: string) {
						matches.push('&lt;Maths won\'t display in this view. See the help notepad.&gt;<br />' + match);
						let n = matches.length - 1;
						return '%ph' + n + 'ph%';
					}
				},
				{
					type: 'output',
					filter: function(text: string) {
						for (let i = 0; i < matches.length; ++i) {
							let pat = '%ph' + i + 'ph%';
							text = text.replace(new RegExp(pat, 'gi'), matches[i]);
						}
						// reset array
						matches = [];
						return text;
					}
				}
			];
		});

		extension('fend', fendTransformer);

		extension('colour', colourTransformer);

		const html = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true,
			extensions: ['mock', 'colour', 'fend']
		} as IShowdownOpts)
			.makeHtml(mdGuideNote.elements[0].content)
			.split('<ul>').join('<ul class="browser-default">')
			.split('<li>').join('<li class="browser-default">')
			.split('<a').join('<a target="_blank" rel="nofollow noreferrer"');

		return {
			title: mdGuideNote.title,
			html: html
		};
	}
}
