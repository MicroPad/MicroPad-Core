import './SearchComponent.css';
import React from 'react';
import { Icon, Modal, NavItem } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { searchConnector } from './SearchContainer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import Select from 'react-select';
import { GroupTypeBase, OptionTypeBase } from 'react-select/src/types';
import { SearchResult } from '../../../reducers/SearchReducer';

type Props = ConnectedProps<typeof searchConnector>;

export default class SearchComponent extends React.Component<Props, never> {
	private static componentCount: number = 0;

	private readonly componentCount = SearchComponent.componentCount++;
	private readonly modalId = `search-modal--${this.componentCount}`;
	private selectEl: any | null = null;

	override shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<never>, nextContext: any): boolean {
		// return this.props.query !== nextProps.query || this.props.notepad !== nextProps.notepad;
		return true;
	}

	override render() {
		const results = [
			...(this.props.notepad && this.props.results[this.props.notepad?.title ?? ''] ? [this.getSearchResultGroup([this.props.notepad.title, this.props.results[this.props.notepad.title]])] : []),
			...Object.entries(this.props.results)
				.filter(([notepadTitle]) => notepadTitle !== this.props.notepad?.title)
				.map(this.getSearchResultGroup)
		];

		return (
			<Modal
				id={this.modalId}
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
					isClearable={true}
					isSearchable={true}
					options={results}
					filterOption={() => true}
					placeholder={`Search by note title or a hashtag`}
					onInputChange={value => {
						this.props.search(value);
					}}
					onChange={item => {
						if (item) this.props.loadResult(this.props.notepad?.title, item.value);
						this.closeModal();
					}}
					styles={{
						control: (styles, props) => ({
							...styles,
							backgroundColor: 'var(--mp-theme-chrome)'
						}),
						option: (styles, props) => ({
							...styles,
							backgroundColor: props.isFocused ? 'var(--mp-theme-accent)' : 'var(--mp-theme-chrome)',
							color: props.isFocused ? 'var(--mp-theme-accentContent)' : 'var(--mp-theme-explorerContent)'
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
						}),
					}}
				/>

			</Modal>
		);
	}

	private getSearchResultGroup = ([notepadTitle, results]: [string, SearchResult[]]): GroupTypeBase<OptionTypeBase> => {
		return {
			label: notepadTitle,
			options: results
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

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
