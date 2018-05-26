import * as React from 'react';
import { Modal } from 'react-materialize';
import { INotepad } from '../../../../types/NotepadTypes';
import * as Parser from 'upad-parse/dist/index';
// @ts-ignore
import helpNpx from '!raw-loader!../../../../assets/Help.npx';
import { Converter, extension } from 'showdown';
import { IShowdownOpts } from './MarkdownElementComponent';
import './MarkdownHelpComponent.css';

export default class MarkdownHelpComponent extends React.Component {
	render() {
		Parser.parse(helpNpx, ['asciimath']);
		const help: INotepad = Parser.notepad;
		const mdGuide = help.sections[1].notes[0];

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

		const html = new Converter({
			parseImgDimensions: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			tables: true,
			tasklists: true,
			prefixHeaderId: 'mdheader_',
			emoji: true,
			extensions: ['mock']
		} as IShowdownOpts).makeHtml(mdGuide.elements[0].content);

		return (
			<Modal
				header={mdGuide.title}
				trigger={<a href="#!">Formatting Help</a>}
				fixedFooter={true}>
				<div id="markdown-help" dangerouslySetInnerHTML={{
					__html: html
						.split('<ul>').join('<ul class="browser-default">')
						.split('<li>').join('<li class="browser-default">')
				}} />
			</Modal>
		);
	}
}
