import * as React from 'react';
import './NoteElementModalComponent.css';
import { useState } from 'react';
import { Converter, extension } from 'showdown';
import { IShowdownOpts } from '../note-viewer/elements/markdown/MarkdownElementComponent';
import { Modal } from 'react-materialize';
import { Translators } from 'upad-parse';
import { colourTransformer, fendTransformer } from '../note-viewer/elements/markdown/MarkdownTransformers';
import { DEFAULT_MODAL_OPTIONS } from '../../util';
import { Note, Notepad } from 'upad-parse/dist';

export type Props = {
	npx: string,
	findNote: (notepad: Notepad) => Note,
	id?: string,
	trigger?: React.ReactNode
};

type RenderedNote = {
	title: string,
	html: string
};

const NoteElementModalComponent = (props: Props) => {
	const [renderedNote, setRenderedNote] = useState<RenderedNote | null>(null);
	if (!renderedNote) {
		renderNote(props).then(note => setRenderedNote(note));
		return null;
	}

	return (
		<Modal
			id={props.id}
			trigger={props.trigger}
			fixedFooter={true}
			header={renderedNote.title}
			options={DEFAULT_MODAL_OPTIONS}>
			<div id="markdown-help" dangerouslySetInnerHTML={{
				__html: renderedNote.html
			}} />
		</Modal>
	);
}
export default NoteElementModalComponent;

async function renderNote({ npx, findNote }: Props): Promise<RenderedNote> {
	const note = await Translators.Xml.toNotepadFromNpx(npx).then(findNote);
	// const whatsNewNote = (await Translators.Xml.toNotepadFromNpx(helpNpx)).sections[0].notes[2];

	extension('colour', colourTransformer);
	extension('fend', fendTransformer);
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
		noHeaderId: true,
		emoji: true,
		extensions: ['mock', 'colour', 'fend']
	} as IShowdownOpts)
		.makeHtml(note.elements[0].content)
		.split('<ul>').join('<ul class="browser-default">')
		.split('<li>').join('<li class="browser-default">')
		.split('<a').join('<a target="_blank" rel="nofollow noreferrer"');

	return {
		title: note.title,
		html: html
	};
}
