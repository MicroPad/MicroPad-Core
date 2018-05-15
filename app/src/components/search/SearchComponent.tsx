import * as React from 'react';
import { Autocomplete, Collection, CollectionItem, Icon, Modal, NavItem, Row } from 'react-materialize';
import { INote, INotepad } from '../../types/NotepadTypes';
import { generateGuid } from '../../util';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { shareReplay } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

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
	private triggerClickedSub: Subscription;

	render() {
		const { notepad, query, hashTagResults, loadNote } = this.props;

		this.autoCompleteOptions = {};
		this.mappedNotesToOptions = [];
		notepad.search('').forEach((note: INote, i: number) => {
			this.autoCompleteOptions[`${i + 1}. ${note.parent.title} > ${note.title}`] = null;
			this.mappedNotesToOptions[i] = note;
		});

		const resultElements: JSX.Element[] = hashTagResults.map((note: INote) =>
			<CollectionItem key={generateGuid()} href="#!" onClick={() => loadNote!(note.internalRef)}>{note.parent.title} > {note.title}</CollectionItem>
		);

		return (
			<Modal
				key={`search-${notepad.title}`}
				header="Search Notepad"
				trigger={<NavItem id={`search-button`} href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Autocomplete
						id="search-input"
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

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const searchTrigger = document.getElementById('search-button');
		if (!searchTrigger) return;

		if (!!this.triggerClickedSub) this.triggerClickedSub.unsubscribe();
		this.triggerClickedSub = fromEvent(searchTrigger, 'click')
			.pipe(
				shareReplay()
			)
			.subscribe(() => {
				const input = document.getElementById('search-input');
				if (!input) return;

				setTimeout(() => input.focus(), 0);
			});
	}

	componentWillUnmount() {
		this.triggerClickedSub.unsubscribe();
	}

	private onInput = (event, value: string) => {
		const { search } = this.props;
		search!(value);
	}

	private loadNoteFromInput = (value: string) => {
		const { loadNote, search } = this.props;
		const index: number = parseInt(value.split('.')[0], 10) - 1;

		this.closeModal();
		setTimeout(() => search!(''), 10);
		loadNote!(this.mappedNotesToOptions[index].internalRef);
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
