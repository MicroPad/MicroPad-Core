import * as React from 'react';
import { Icon, Autocomplete, Modal, NavItem, Row, Collection, CollectionItem } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';

export interface ISearchComponentProps {
	notepad: INotepad;
	hashTagResults: INote[];
	query: string;
	loadNote?: (ref: string) => void;
	search?: (query: string) => void;
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private mappedNotesToOptions: INote[];
	private autoCompleteOptions: object;

	render() {
		const { notepad, query, hashTagResults, loadNote } = this.props;

		this.autoCompleteOptions = {};
		this.mappedNotesToOptions = [];
		notepad.search('').forEach((note: INote, i: number) => {
			this.autoCompleteOptions[`${i}. ${note.title}`] = null;
			this.mappedNotesToOptions[i] = note;
		});

		const resultElements: JSX.Element[] = hashTagResults.map((note: INote) =>
			<CollectionItem key={generateGuid()} href="#!" onClick={() => loadNote!(note.internalRef)}>{note.title}</CollectionItem>
		);

		return (
			<Modal
				key={`search-${notepad.title}`}
				header="Search Notepad"
				trigger={<NavItem href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Autocomplete
						s={12}
						title="Search by note title or a hashtag"
						onChange={this.onInput}
						value={query}
						onAutocomplete={this.loadNoteFromInput}
						data={this.autoCompleteOptions} />
				</Row>

				{
					hashTagResults.length > 0
					&& <div>
						<h4>Hashtag Search Results</h4>
						<Collection>{resultElements}</Collection>
					</div>
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

		loadNote!(this.mappedNotesToOptions[index].internalRef);
	}
}
