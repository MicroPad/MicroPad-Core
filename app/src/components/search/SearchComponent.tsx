import * as React from 'react';
import { Collection, CollectionItem, Icon, Input, Modal, NavItem, Row } from 'react-materialize';
import { shareReplay } from 'rxjs/operators';
import { FlatNotepad } from 'upad-parse/dist';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs';
import { HashTagSearchResult, HashTagSearchResults } from '../../reducers/SearchReducer';
import { RestoreJsonNotepadAndLoadNoteAction, SearchIndices } from '../../types/ActionTypes';

export interface ISearchComponentProps {
	notepad?: FlatNotepad;
	indices: SearchIndices;
	hashTagResults: HashTagSearchResults;
	query: string;
	loadNote?: (ref: string) => void;
	loadNoteFromHashTagResults?: (data: RestoreJsonNotepadAndLoadNoteAction) => void;
	search?: (query: string) => void;
}

export default class SearchComponent extends React.Component<ISearchComponentProps> {
	private searchInput: Input;
	private results: JSX.Element[];
	private triggerClickedSub: Subscription;
	private readonly supportsDataElement = !!window['HTMLDataListElement'] && !(!!window['isElectron'] && window.navigator.platform === 'MacIntel');

	render() {
		const { notepad, query, hashTagResults, indices } = this.props;

		this.results = [];

		if (!!notepad) {
			const index = indices.find(idx => idx.notepad.title === notepad.title);
			if (!!index) {
				const results = new Set(
					query.split(' ')
						.filter(word => word.length > 0)
						.map(word => notepad.search(index.trie, word))
						.reduce((acc, val) => acc.concat(val), [])
				);

				this.results = Array.from(results)
					.sort((a, b) => Math.abs(query.length - a.title.length) - Math.abs(query.length - b.title.length))
					.map((note) => {
						if (this.supportsDataElement) {
							return (
								<option key={note.internalRef} data-value={note.internalRef}>
									{notepad.sections[note.parent as string].title} > {note.title}
								</option>
							);
						}

						return (
							<li key={note.internalRef} data-value={note.internalRef}>
								<a href="#!" onClick={() => this.loadNoteFromInput(note.internalRef)}>
									{notepad.sections[note.parent as string].title} > {note.title}
								</a>
							</li>
						);
					});
			}
		}

		return (
			<Modal
				key={`search-${(notepad || { title: 'all' }).title}`}
				header="Search Notepad"
				trigger={<NavItem id={`search-button`} href="#!"><Icon left={true}>search</Icon> Search</NavItem>}>
				<Row>
					<Input
						list="search-results"
						ref={e => this.searchInput = e!}
						s={12}
						label={`Search by ${(!!notepad && `note title or a`) || ''} hashtag`}
						onChange={this.onInput}
						value={query}
						autoComplete="off"
						data-lpignore="true" />

					{
						this.supportsDataElement
						&& <datalist id="search-results" key={`results-${query}`}>
							{this.results}
						</datalist>
					}
				</Row>

				{
					// General search results for browsers that don't support <datalist>
					!this.supportsDataElement
					&& <div>
						<ul className="browser-default">{this.results}</ul>
						<em>Searching in basic mode. You can try a more modern browser like <a href="https://www.google.com/chrome/" target="_blank" rel="nofollow noreferrer">Google Chrome</a> or <a href="https://www.mozilla.org/firefox/" target="_blank" rel="nofollow noreferrer">Mozilla Firefox</a>.</em>
					</div>
				}

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
				const input = this.searchInput;
				if (!input) return;

				setTimeout(() => input.input.focus(), 0);
			});
	}

	componentWillUnmount() {
		this.triggerClickedSub.unsubscribe();
	}

	private onInput = (event, value: string) => {
		const { search } = this.props;
		if (!search) return;

		let result;
		if (this.supportsDataElement) {
			result = this.results
				.map(e => e.props)
				.find(e => e.children.join('') === value);
		}

		if (!!result) {
			this.loadNoteFromInput(result['data-value']);
			return;
		}

		search(value);
	}

	private loadNoteFromInput = (ref: string) => {
		const { loadNote, search } = this.props;
		if (!loadNote || !search) return;

		this.closeModal();
		setTimeout(() => search(''), 10);
		loadNote(ref);
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
