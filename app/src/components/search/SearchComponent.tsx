import * as React from 'react';
import { Autocomplete, Collection, CollectionItem, Icon, Modal, NavItem, Row } from 'react-materialize';
import { shareReplay } from 'rxjs/operators';
import { FlatNotepad, Note } from 'upad-parse/dist';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs';
import { HashTagSearchResult, HashTagSearchResults } from '../../reducers/SearchReducer';
import { RestoreJsonNotepadAndLoadNoteAction } from '../../types/ActionTypes';

export interface ISearchComponentProps {
	notepad?: FlatNotepad;
	hashTagResults: HashTagSearchResults;
	query: string;
	loadNote?: (ref: string) => void;
	loadNoteFromHashTagResults?: (data: RestoreJsonNotepadAndLoadNoteAction) => void;
	search?: (query: string) => void;
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private mappedNotesToOptions: Note[];
	private autoCompleteOptions: object;
	private triggerClickedSub: Subscription;

	render() {
		const { notepad, query, hashTagResults } = this.props;

		this.autoCompleteOptions = {};
		this.mappedNotesToOptions = [];

		if (!!notepad) {
			notepad.search('').forEach((note: Note, i: number) => {
				this.autoCompleteOptions[`${i + 1}. ${notepad.sections[note.parent as string].title} > ${note.title}`] = null;
				this.mappedNotesToOptions[i] = note;
			});
		}

		return (
			<Modal
				key={`search-${(notepad || { title: 'all' }).title}`}
				header="Search Notepad"
				trigger={<NavItem id={`search-button`} href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Autocomplete
						id="search-input"
						s={12}
						title={`Search by ${(!!notepad && `note title or a`) || ''} hashtag`}
						onChange={this.onInput}
						value={query}
						onAutocomplete={this.loadNoteFromInput}
						data={this.autoCompleteOptions} />
				</Row>

				{
					// Display results for the current notepad first
					!!notepad
					&& !!hashTagResults[notepad.title]
					&& hashTagResults[notepad.title].length > 0
					&& this.generateHashTagSearchResultList(notepad.title, hashTagResults[notepad.title])
				}

				{
					// Display results for all the other notepads
					Object.entries(hashTagResults)
						.filter(([notepadTitle, results]: [string, HashTagSearchResult[]]) =>
							!!results && results.length > 0 && (!notepad || notepadTitle !== notepad.title)
						)
						.map(([notepadTitle, results]: [string, HashTagSearchResult[]]) =>
							this.generateHashTagSearchResultList(notepadTitle, results)
						)
				}
			</Modal>
		);
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const searchTrigger = document.querySelector(`#search-button > a`);
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

	private generateHashTagSearchResultList = (notepadTitle: string, results: HashTagSearchResult[]): JSX.Element | null => {
		const { loadNoteFromHashTagResults } = this.props;
		if (!loadNoteFromHashTagResults) return null;

		return (
			<div key={`res-collection-list-${notepadTitle}`}>
				<h5 key={`res-collection-header-${notepadTitle}`}>{notepadTitle}</h5>
				<Collection key={`res-collection-${notepadTitle}`}>{
					results.map(result => (
						<CollectionItem
							key={`res-${notepadTitle}-${result.parentTitle}-${result.title}-item`}
							href="#!"
							onClick={() => {
								loadNoteFromHashTagResults({ notepadTitle, noteRef: result.noteRef });
								setTimeout(() => this.closeModal(), 0);
							}}>
							{result.parentTitle} > {result.title}
						</CollectionItem>
					))
				}</Collection>
			</div>
		);
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
