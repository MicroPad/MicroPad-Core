import * as React from 'react';
import { Icon, Autocomplete, Modal, NavItem, Row, Collection, CollectionItem } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';

export interface ISearchComponentProps {
	notepad: INotepad;
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	render() {
		const { notepad } = this.props;

		const autoCompleteOptions = {};
		notepad.search('').map((note: INote) => autoCompleteOptions[note.title] = null);

		return (
			<Modal
				key={`search-${notepad.title}`}
				header="Search Notepad"
				trigger={<NavItem href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Autocomplete s={12} title="Search by note title" data={autoCompleteOptions} />
				</Row>
			</Modal>
		);
	}
}
