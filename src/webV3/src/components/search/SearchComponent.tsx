import * as React from 'react';
import { Icon, Autocomplete, Modal, NavItem, Row, Collection, CollectionItem } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';
import * as ReactDOM from 'react-dom';

export interface ISearchComponentProps {
	notepad: INotepad;
	loadNote?: (note: INote) => void;
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private searchInput: HTMLInputElement;
	private mappedNotesToOptions: INote[];

	render() {
		const { notepad } = this.props;

		const autoCompleteOptions = {};
		this.mappedNotesToOptions = [];
		notepad.search('').forEach((note: INote, i: number) => {
			autoCompleteOptions[`${i}. ${note.title}`] = null;
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
						onAutocomplete={this.loadNoteFromInput}
						data={autoCompleteOptions} />
				</Row>
			</Modal>
		);
	}

	private loadNoteFromInput = (value: string) => {
		const { loadNote } = this.props;
		const index: number = parseInt(value.split('.')[0], 10);

		loadNote!(this.mappedNotesToOptions[index]);
	}
}
