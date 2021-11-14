import './SearchComponent.css';
import React from 'react';
import { Icon, NavItem } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { searchConnector } from './SearchContainer';
import { DEFAULT_MODAL_OPTIONS } from '../../util';
import Select, { GroupBase } from 'react-select';
import { SearchResult } from '../../reducers/SearchReducer';
import SingletonModalComponent from '../singleton-modal/SingletonModalContainer';

type Props = ConnectedProps<typeof searchConnector>;

type SearchResultOption = {
	label: string,
	value: SearchResult & { notepadTitle: string }
};

export default class SearchComponent extends React.Component<Props, never> {
	private selectEl: any | null = null;

	override render() {
		const results = [
			...(this.props.notepad && this.props.results[this.props.notepad?.title ?? ''] ? [this.getSearchResultGroup([this.props.notepad.title, this.props.results[this.props.notepad.title]])] : []),
			...Object.entries(this.props.results)
				.filter(([notepadTitle]) => notepadTitle !== this.props.notepad?.title)
				.map(this.getSearchResultGroup)
		];

		return (
			<SingletonModalComponent
				id="search-modal"
				key={`search-${this.props.notepad?.title ?? 'all'}`}
				header="Search"
				trigger={
					<NavItem href="#!" className="header__top-level-item">
						<Icon left={true}>search</Icon> Search
					</NavItem>
				}
				options={{
					...DEFAULT_MODAL_OPTIONS,
					onOpenEnd: modal => {
						DEFAULT_MODAL_OPTIONS.onOpenEnd?.(modal);
						setTimeout(() => this.selectEl?.focus(), 0);
					}
				}}>

				<Select
					ref={el => this.selectEl = el}
					className="search__autocomplete"
					isSearchable={true}
					menuIsOpen={this.props.showResults}
					options={results}
					filterOption={() => true}
					placeholder={`Search by note title or a hashtag`}
					noOptionsMessage={() => `No search results found`}
					inputValue={this.props.query}
					onInputChange={value => {
						this.props.search(value);
					}}
					// @ts-expect-error TS-2322, the type definitions from the library are wrong, they say we get a
					// group as `item` but we really get the option.
					onChange={(item: SearchResultOption) => {
						console.log(item);
						// if (item) this.props.loadResult(this.props.notepad?.title, item.value);
						this.closeModal();
					}}
					value={null}
					onFocus={() => this.props.setSearchResultVisibility(true)}
					onBlur={() => this.props.setSearchResultVisibility(false)}
					styles={{
						control: (styles, props) => ({
							...styles,
							backgroundColor: 'var(--mp-theme-chrome)'
						}),
						option: (styles, props) => ({
							...styles,
							backgroundColor: props.isFocused ? 'var(--mp-theme-accent)' : 'var(--mp-theme-chrome)',
							color: props.isFocused ? 'var(--mp-theme-accentContent)' : 'var(--mp-theme-explorerContent)',
							':active': {
								backgroundColor: props.isFocused ? 'var(--mp-theme-accent)' : 'var(--mp-theme-chrome)',
								color: props.isFocused ? 'var(--mp-theme-accentContent)' : 'var(--mp-theme-explorerContent)'
							}
						}),
						group: (styles, props) => ({
							...styles,
							backgroundColor: 'var(--mp-theme-chrome)',
							color: 'var(--mp-theme-explorerContent)'
						}),
						menuList: (styles, props) => ({
							...styles,
							backgroundColor: 'var(--mp-theme-chrome)',
							color: 'var(--mp-theme-explorerContent)'
						}),
						noOptionsMessage: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						groupHeading: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						singleValue: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						placeholder: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						dropdownIndicator: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						clearIndicator: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						}),
						input: (styles, props) => ({
							...styles,
							color: 'var(--mp-theme-explorerContent)'
						})
					}}
				/>
			</SingletonModalComponent>
		);
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}

	private getSearchResultGroup = ([notepadTitle, results]: [string, SearchResult[]]): GroupBase<SearchResultOption> => {
		const seen = new Set<string>();

		return {
			label: notepadTitle,
			options: results
				.filter(result => {
					if (seen.has(result.noteRef)) return false;
					seen.add(result.noteRef);
					return true;
				})
				.map(result => ({
					label: `${result.parentTitle} > ${result.title}`,
					value: {
						...result,
						notepadTitle
					}
				}))
				.sort((a, b) => Math.abs(this.props.query.length - a.value.title.length) - Math.abs(this.props.query.length - b.value.title.length))
		};
	}
}
