const INDENT_AND_LIST_PATTERN = /^([\t ]*[-*+] \[] |[\t ]*[-*+] \[ ] |[\t ]*[-*+] \[[Xx]] |[\t ]*[-*+] |\s*)/;

export function enableTabs(el: HTMLTextAreaElement, event): boolean | void {
	const value = el.value;
	const selectionStart = el.selectionStart;
	const selectionEnd = el.selectionEnd;

	if (event.keyCode === 9) { // Key === tab
		event.preventDefault();
		setNativeValue(el, value.substring(0, selectionStart) + '\t' + value.substring(selectionEnd));
		el.selectionStart = el.selectionEnd = selectionStart + 1;

		el.dispatchEvent(new Event('input', { bubbles: true }));
		return false;
	} else if (event.keyCode === 13) { // Key === enter
		event.preventDefault();
		// I adapted el from https://stackoverflow.com/a/21715788
		const currentLine = el.value.substr(0, el.selectionStart).split('\n').pop();
		const indent = currentLine?.match(INDENT_AND_LIST_PATTERN)?.[0] ?? '';

		const textBefore = value.substring(0, selectionStart);
		const textAfter = value.substring(selectionStart, value.length);

		// Manually insert the new line plus the same level of indentation as the line before
		event.preventDefault();
		setNativeValue(el, `${textBefore}\n${indent}${textAfter}`);
		el.selectionStart = el.selectionEnd = selectionStart + indent.length + 1;

		el.dispatchEvent(new Event('input', { bubbles: true }));
		return false;
	}

	// Thanks to https://github.com/facebook/react/issues/10135#issuecomment-314441175
	function setNativeValue(element, value) {
		const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set!;
		const prototype = Object.getPrototypeOf(element);
		const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set!;

		if (valueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else {
			valueSetter.call(element, value);
		}
	}
}
