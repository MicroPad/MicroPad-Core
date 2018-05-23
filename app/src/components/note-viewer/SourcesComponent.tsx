import * as React from 'react';
import { Autocomplete, Button, Icon, Modal } from 'react-materialize';
import { INote, NoteElement, Source } from '../../types/NotepadTypes';
import { Dialog } from '../../dialogs';

export interface ISourcesComponent {
	element: NoteElement;
	note: INote;
	updateBibliography?: (bibliography: Source[]) => void;
}

export default class SourcesComponent extends React.Component<ISourcesComponent> {
	render() {
		const { note, element } = this.props;
		const bibliography = note.bibliography.filter(source => source.item === element.args.id);

		const sources: JSX.Element[] = [];
		bibliography.forEach(source => sources.push(
			<div key={`${note.title}-source-${source.id}`}>
				<a href={source.content} rel="noopener noreferrer" target="_blank">Open URL</a><br />
				<Autocomplete type="url" value={source.content} label="URL" onChange={(e, v) => this.onSourceEdit(source.id, v)}  data={{}} />
			</div>
		));

		return (
			<Modal
				header="Bibliography"
				trigger={<Button className="blue" waves="light"><Icon left={true}>school</Icon> Bibliography ({bibliography.length})</Button>}>
				<Button className="blue" waves="light" onClick={this.addSource}><Icon left={true}>add</Icon> Add Source</Button>
				<br /><br />

				{sources}
			</Modal>
		);
	}

	private onSourceEdit = (id: string, value: string) => {
		const { updateBibliography, note } = this.props;

		if (value.length === 0) {
			// Delete source
			updateBibliography!(note.bibliography.filter(source => source.id !== id));
			return;
		}

		updateBibliography!(
			note.bibliography
				.map(source =>
					(source.id !== id)
					? source
					: { ...source, content: value }
				)
		);
	}

	private addSource = async () => {
		const { updateBibliography, element, note } = this.props;

		const url = await Dialog.prompt('Source URL:');
		if (!url || url.length === 0) return;

		updateBibliography!([
			...note.bibliography,
			{
				id: (note.bibliography.length + 1).toString(10),
				item: element.args.id,
				content: url
			}
		]);
	}
}
