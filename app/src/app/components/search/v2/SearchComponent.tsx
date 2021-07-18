import './SearchComponent.css';
import React from 'react';
import { Dropdown, Icon, Modal, NavItem } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { searchConnector } from './SearchContainer';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import { Subject } from 'rxjs';

type Props = ConnectedProps<typeof searchConnector>;

// This is a bit complex because we need to use the old-school imperative materialize approach for an async autocomplete
// see: https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/
export default class SearchComponent extends React.Component<Props, never> {
	private static componentCount: number = 0;

	private readonly componentCount = SearchComponent.componentCount++;
	private readonly modalId = `search-modal--${this.componentCount}`;
	private readonly inputId = `search__autocomplete--${this.componentCount}`;
	private readonly dropdownId = `search__results--${this.componentCount}`;
	private readonly destroyed$ = new Subject<void>();
	private inputElRef: React.RefObject<HTMLInputElement> = { current: null };

	override shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<never>, nextContext: any): boolean {
		// return this.props.query !== nextProps.query || this.props.notepad !== nextProps.notepad;
		return true;
	}

	override render() {
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
						// setTimeout(() => searchInput.current?.focus(), 0); TODO
					}
				}}>

				<input
					id={this.inputId}
					type="text"
					// label={`Search by ${(!!this.props.notepad && `note title or a`) || ''} hashtag`}
					value={this.props.query}
					onChange={event => this.props.search(event.target.value)}
					onKeyDown={}
				/>

				<Dropdown trigger={<div id={this.dropdownId} />}>
					{
						this.props.results[this.props.notepad?.title || '']?.map(result => <a key={result.noteRef} href="#!">{result.title}</a>)
					}
				</Dropdown>
			</Modal>
		);
	}

	// override componentDidMount() {
	// 	// combineLatest([domReady$.pipe(take(1)), RE_INIT_AUTOCOMPLETE$]).pipe(
	// 	// 	takeUntil(this.destroyed$)
	// 	// ).subscribe(() => {
	// 	// 	if (this.inputElRef.current) {
	// 	// 		const instance = M.Autocomplete.init(this.inputElRef.current, {
	// 	// 			data: this.props.results
	// 	// 		});
	// 	//
	// 	// 		if (Object.keys(this.props.results).length) {
	// 	// 			instance.open();
	// 	// 		}
	// 	// 	}
	// 	// });
	// }
	//
	// override componentWillUnmount() {
	// 	this.destroyed$.next();
	//
	// 	domReady$.pipe(take(1)).subscribe(() => {
	// 		if (this.inputElRef.current) {
	// 			M.Autocomplete.getInstance(this.inputElRef.current).destroy();
	// 		}
	// 	});
	// }
}
