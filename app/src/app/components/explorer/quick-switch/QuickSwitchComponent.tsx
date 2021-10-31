import './QuickSwitchComponent.css';
import React, { useRef, useState } from 'react';
import { Button, Modal } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import { quickSwitchConnector } from './QuickSwitchContainer';
import Select from 'react-select';

type Props = ConnectedProps<typeof quickSwitchConnector>;

const MODAL_ID = "quick-switch-modal";

const QuickSwitchComponent = (props: Props) => {
	const selectEl = useRef<HTMLElement | null>(null);
	const [menuIsOpen, setResultVisibility] = useState(false);

	const results: ReadonlyArray<{ label: string; value: string }> = props.notepadTitles.map(title => ({
		label: title,
		value: title
	}));

	return (
		<Modal
			id={MODAL_ID}
			header="Quick Switcher"
			trigger={<Button flat>Quick notebook switcher</Button>}
			options={{
				...DEFAULT_MODAL_OPTIONS,
				onOpenEnd: modal => {
					DEFAULT_MODAL_OPTIONS.onOpenEnd?.(modal);
					setTimeout(() => selectEl.current?.focus(), 0);
				}
			}}>

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
		</Modal>
	)
}

export default QuickSwitchComponent;
