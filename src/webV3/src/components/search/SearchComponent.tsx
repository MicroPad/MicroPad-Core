import * as React from 'react';
import { Icon, Autocomplete, Modal, NavItem, Row, Collection, CollectionItem } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';

export interface ISearchComponentProps {
	notepad: INotepad;
	loadNote?: (note: INote) => void;
}

export class HashTagSearchResultsComponent extends React.Component<{
	hashTagResults: INote[];
}> {
	render() {
		const { hashTagResults } = this.props;
		console.log(hashTagResults);

		const resultElements: JSX.Element[] = hashTagResults.map((note: INote) =>
			<CollectionItem key={generateGuid()}>{note.title}</CollectionItem>
		);

		return (
			<Collection>{resultElements}</Collection>
		);
	}
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private mappedNotesToOptions: INote[];
	private autoCompleteOptions: object;
	private hashTagResults: INote[];

	render() {
		const { notepad } = this.props;

		this.autoCompleteOptions = {};
		this.mappedNotesToOptions = [];
		this.hashTagResults = [];
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

				<HashTagSearchResultsComponent hashTagResults={this.hashTagResults} />
			</Modal>
		);
	}

	private onInput = (event, value: string) => {
		this.hashTagResults = [];
		if (value.length <= 1 || value.substring(0, 1) !== '#') return;

		const { notepad } = this.props;
		this.hashTagResults = notepad.search(value);
		console.log(this.hashTagResults);
	}

	private loadNoteFromInput = (value: string) => {
		const { loadNote } = this.props;
		const index: number = parseInt(value.split('.')[0], 10);

		loadNote!(this.mappedNotesToOptions[index]);
	}
}
