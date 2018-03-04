import * as React from 'react';
import { Icon, Autocomplete, Modal, NavItem, Row, Collection, CollectionItem } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';

export interface ISearchComponentProps {
	notepad: INotepad;
	hashTagResults: INote[];
	loadNote?: (note: INote) => void;
	search?: (query: string) => void;
}

export class HashTagSearchResultsComponent extends React.Component<{
	hashTagResults: INote[];
	loadNote: (note: INote) => void;
}> {
	render() {
		const { hashTagResults, loadNote } = this.props;
		console.log(hashTagResults);

		const resultElements: JSX.Element[] = hashTagResults.map((note: INote) =>
			<CollectionItem key={generateGuid()} href="#!" onClick={() => loadNote(note)}>{note.title}</CollectionItem>
		);

		return (
			<div>
				<h4>Hashtag Search</h4>
				<Collection>{resultElements}</Collection>
			</div>
		);
	}
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private mappedNotesToOptions: INote[];
	private autoCompleteOptions: object;

	render() {
		const { notepad, hashTagResults, loadNote } = this.props;

		this.autoCompleteOptions = {};
		this.mappedNotesToOptions = [];
		notepad.search('').forEach((note: INote, i: number) => {
			this.autoCompleteOptions[`${i}. ${note.title}`] = null;
			this.mappedNotesToOptions[i] = note;
		});

		return (
			<Modal
				key={`search-${notepad.title}`}
				header="Search Notepad"
				trigger={<NavItem href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Autocomplete
						s={12}
						title="Search by note title"
						onChange={this.onInput}
						onAutocomplete={this.loadNoteFromInput}
						data={this.autoCompleteOptions} />
				</Row>

				{
					hashTagResults.length > 0
					&& <HashTagSearchResultsComponent hashTagResults={hashTagResults} loadNote={loadNote!} />
				}
			</Modal>
		);
	}

	private onInput = (event, value: string) => {
		const { search } = this.props;
		search!(value);
	}

	private loadNoteFromInput = (value: string) => {
		const { loadNote } = this.props;
		const index: number = parseInt(value.split('.')[0], 10);

		loadNote!(this.mappedNotesToOptions[index]);
	}
}
