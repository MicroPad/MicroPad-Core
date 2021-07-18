import type { AutocompleteOptions } from 'react-materialize';

declare global {
	namespace M {
		function toast(options: Partial<ToastOptions>): void;
		const Toast: {
			getInstance: (element: HTMLElement) => ToastInstance,
			dismissAll: () => void
		};

		const Modal: {
			getInstance: (element: HTMLElement) => ModalInstance
		};

		const Autocomplete: {
			init(elems: Element | Element[], options: AutocompleteOptions): AutocompleteInstance,
			getInstance(element: Element): AutocompleteInstance
		}
	}
}

/** https://materializecss.com/toasts.html */
export type ToastOptions = {
	/** The HTML content of the Toast. */
	html: string,
	/** Length in ms the Toast stays before dismissal. */
	displayLength: number,
	/** Transition in duration in milliseconds. */
	inDuration: number,
	/** Transition out duration in milliseconds. */
	outDuration: number,
	/** Classes to be added to the toast element. */
	classes: string,
	/** Callback function called when toast is dismissed. */
	completeCallback: () => void,
	/** The percentage of the toast's width it takes for a drag to dismiss a Toast. */
	activationPercent: number
};
export type ToastInstance = {
	dismiss: () => void
};

export type ModalInstance = {
	open: () => void,
	close: () => void,
	destroy: () => void
};

/** https://materializecss.com/autocomplete.html */
export type AutocompleteInstance = {
	/** The DOM element the plugin was initialized with. */
	el: HTMLElement,
	/** The options the instance was initialized with. */
	options: AutocompleteOptions,
	/** If the autocomplete is open. */
	isOpen: boolean,
	/** Number of matching autocomplete options. */
	count: number,
	/** Index of the current selected option. */
	activeIndex: number,
	/** Instance of the dropdown plugin for this autocomplete. */
	dropdown: any,

	/** Open autocomplete dropdown. */
	open(): void,
	/** Close autocomplete dropdown. */
	close(): void,
	/**
	 * Select a specific autocomplete options.
	 * @param el Element of the autocomplete option
	 */
	selectOption(el: Element),
	/**
	 * Update autocomplete options data.
	 * @param data Autocomplete options data object.
	 */
	updateData(data: AutocompleteOptions['data']),
	/**
	 * Destroy plugin instance and teardown
	 */
	destroy(): void
};
