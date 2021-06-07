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
