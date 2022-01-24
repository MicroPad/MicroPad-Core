import './QuickSwitchComponent.css';
import React, { useRef, useState } from 'react';
import { ConnectedProps } from 'react-redux';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import { quickSwitchConnector } from './QuickSwitchContainer';
import Select from 'react-select';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import Button2 from '../../Button';

type Props = ConnectedProps<typeof quickSwitchConnector>;

const MODAL_ID = 'quick-switch-modal';

const QuickSwitchComponent = (props: Props) => {
	const selectEl = useRef<HTMLElement | null>(null);
	const [menuIsOpen, setResultVisibility] = useState(false);

	const results: ReadonlyArray<{ label: string; value: string }> = props.notepadTitles
		.filter(title => title !== props.currentTitle)
		.map(title => ({ label: title, value: title }));

	return (
		<SingletonModalComponent
			id={MODAL_ID}
			header="Quick Switcher"
			trigger={<Button2 flat>Quick notebook switcher</Button2>}
			options={{
				...DEFAULT_MODAL_OPTIONS,
				onOpenEnd: modal => {
					DEFAULT_MODAL_OPTIONS.onOpenEnd?.(modal);
					setTimeout(() => selectEl.current?.focus(), 0);
				}
			}}>

			<p>
				<em>
					Fun fact: You can quickly open this switcher by pressing <strong>Ctrl + K</strong> or <strong>⌘ + K</strong>!{' '}
					See the <strong>Shortcuts</strong> note in the <strong>Help</strong> notebook for more ways{' '}
					to avoid using a mouse.
				</em>
			</p>

			<Select
				ref={el => selectEl.current = (el as unknown as HTMLElement)}
				className="quick-switch__autocomplete"
				isSearchable={true}
				menuIsOpen={menuIsOpen}
				options={results}
				placeholder={`Search by notebook title`}
				noOptionsMessage={() => `Nothing to see here`}
				onChange={item => {
					if (item) props.loadNotepad(item.value);

					const modalRef = document.getElementById(MODAL_ID);
					if (modalRef) M.Modal.getInstance(modalRef).close();
				}}
				value={null}
				onFocus={() => setResultVisibility(true)}
				onBlur={() => setResultVisibility(false)}
				styles={{
					control: (styles, props) => ({
						...styles,
						backgroundColor: 'var(--mp-theme-chrome)',
						borderColor: props.isFocused ? 'var(--mp-theme-accent)' : undefined,
						boxShadow: props.isFocused ? '0 0 0 1px var(--mp-theme-accent)' : undefined,
						'&:hover': {
							borderColor: 'var(--mp-theme-accent)',
							boxShadow: '0 0 0 1px var(--mp-theme-accent)'
						}
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
	)
}

export default QuickSwitchComponent;
