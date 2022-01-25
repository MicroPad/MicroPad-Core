import React from 'react';
import { Icon, TextInput } from 'react-materialize';
import { Dialog } from '../../../services/dialogs';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import { sourcesConnector } from './SourcesContainer';
import { ConnectedProps } from 'react-redux';
import { Note } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import Button2 from '../../Button';

const SourcesComponent = (props: ConnectedProps<typeof sourcesConnector>) => {
	const { note, element } = props;
	if (!note || !element) return null;

	const bibliography = note.bibliography
		.filter(source => source.item === element.args.id && !source.content.startsWith('javascript:'));

	const sources: JSX.Element[] = [];
	bibliography.forEach(source => sources.push(
		<div key={`${note.title}-source-${source.id}`}>
			<a href={source.content} rel="noopener noreferrer" target="_blank">Open URL</a><br />
			<TextInput type="url" value={source.content} label="URL" onChange={e => onSourceEdit(source.id, e.target.value, note)} />
		</div>
	));

	return (
		<SingletonModalComponent
			header="Bibliography"
			trigger={
				<Button2 flat small waves="light" style={{ padding: '0' }}>
					<Icon left style={{ marginRight: '5px' }}>school</Icon> Bibliography ({bibliography.length})
				</Button2>
			}
			options={DEFAULT_MODAL_OPTIONS}>
			<Button2 className="accent-btn" waves="light" onClick={() => addSource(note, element)}>
				<Icon left={true}>add</Icon> Add Source
			</Button2>
			<br /><br />

			{sources}
		</SingletonModalComponent>
	);

	function onSourceEdit(id: number, value: string, note: Note) {
		if (value.length === 0) {
			// Delete source
			props.updateBibliography(note.bibliography.filter(source => source.id !== id), note.internalRef);
			return;
		}

		props.updateBibliography(
			note.bibliography.map(source => source.id !== id ? source : { ...source, content: value }),
			note.internalRef
		);
	}

	async function addSource(note: Note, element: NoteElement) {
		const { updateBibliography } = props;

		const url = await Dialog.prompt('Source URL:');
		if (!url || url.length === 0 || url.startsWith('javascript:')) return;

		updateBibliography([
			...note.bibliography,
			{
				id: note.bibliography.length + 1,
				item: element.args.id,
				content: url
			}
		], note.internalRef);
	}
};
export default SourcesComponent;
