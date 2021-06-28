import * as React from 'react';
import { Collection, Icon, Modal, NavItem, Row, TextInput } from 'react-materialize';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FlatNotepad } from 'upad-parse/dist';
import { Subject } from 'rxjs';
import { RestoreJsonNotepadAndLoadNoteAction, SearchIndices } from '../../types/ActionTypes';
import { HashTagSearchResult, HashTagSearchResults } from '../../reducers/SearchReducer';
import { DEFAULT_MODAL_OPTIONS } from '../../util';

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
	private searchInput: React.RefObject<HTMLInputElement> = { current: null };
	private results!: JSX.Element[];
	private readonly supportsDataElement = !!window['HTMLDataListElement'];
	private readonly currentValue$: Subject<string> = new Subject<string>();
	private readonly destroy$: Subject<void> = new Subject<void>();

	render() {
		const { notepad, query, hashTagResults, indices } = this.props;

		this.results = [];

		if (!!notepad) {
			const index = indices.find(idx => idx.notepad.title === notepad.title);
			if (!!index && query.charAt(0) !== '#') {
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
									{`${notepad.sections[note.parent as string].title.trim()} > ${note.title.trim()}`}
								</option>
							);
						}

						return (
							<li key={note.internalRef} data-value={note.internalRef}>
								<a href="#!" onClick={() => this.loadNoteFromInput(note.internalRef)}>
									{`${notepad.sections[note.parent as string].title} > ${note.title}`}
								</a>
							</li>
						);
					});
			}
		}

		return (
			<Modal
				id="search-modal"
				key={`search-${(notepad || { title: 'all' }).title}`}
				header="Search"
				trigger={<NavItem href="#!" className="header__top-level-item"><Icon left={true}>search</Icon> Search</NavItem>}
				options={{
					...DEFAULT_MODAL_OPTIONS,
					onOpenEnd: modal => {
						DEFAULT_MODAL_OPTIONS.onOpenEnd?.(modal);
						setTimeout(() => this.searchInput.current?.focus(), 0);
					}
				}}>
				<Row>
					<TextInput
						inputClassName="search-results"
						ref={this.searchInput}
						s={12}
						label={`Search by ${(!!notepad && `note title or a`) || ''} hashtag`}
						onChange={event => {
							this.currentValue$.next(event.target.value)
						}}
						value={query}
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
						<em>Searching in basic mode. You can try a more modern browser like <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer nofollow">Google Chrome</a> or <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer nofollow">Mozilla Firefox</a>.</em>
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
		const { search } = this.props;
		if (!search) throw new Error('Missing search prop.');

		this.currentValue$.pipe(
			takeUntil(this.destroy$)
		).subscribe(search);

		this.currentValue$.pipe(
			takeUntil(this.destroy$),
			debounceTime(150)
		).subscribe(value => this.onInput(value));
	}

	componentWillUnmount() {
		this.destroy$.next();
	}

	private onInput = (value: string) => {
		let result;
		if (this.supportsDataElement) {
			result = this.results
				.map(datalistElement => datalistElement.props)
				.find(datalistElement => {
					console.log(datalistElement);
					console.log(value);
					return datalistElement.children === value;
				});
		}

		if (!!result) {
			this.loadNoteFromInput(result['data-value']);
			return;
		}
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
						<a
							key={`res-${notepadTitle}-${result.parentTitle}-${result.title}-item`}
							href="#!"
							onClick={() => {
								loadNoteFromHashTagResults({ notepadTitle, noteRef: result.noteRef });
								setTimeout(() => this.closeModal(), 0);
							}}>
							{result.parentTitle} {'>'} {result.title}
						</a>
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
