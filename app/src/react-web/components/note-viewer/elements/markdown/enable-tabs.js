export function enableTabs(event) {
	const value = this.value;
	const selectionStart = this.selectionStart;
	const selectionEnd = this.selectionEnd;

	if (event.keyCode === 9) { // Key === tab
		setNativeValue(this, value.substring(0, selectionStart) + '\t' + value.substring(selectionEnd));
		this.selectionStart = this.selectionEnd = selectionStart + 1;

		this.dispatchEvent(new Event('input', { bubbles: true }));
		return false;
	} else if (event.keyCode === 13) { // Key === enter
		// I adapted this from https://stackoverflow.com/a/21715788
		const currentLine = this.value.substr(0, this.selectionStart).split("\n").pop();
		const indent = currentLine.match(/^\s*/)[0];
		const textBefore = value.substring(0, selectionStart);
		const textAfter  = value.substring(selectionStart, value.length);

		// Manually insert the new line plus the same level of indentation as the line before
		event.preventDefault();
		setNativeValue(this, `${textBefore}\n${indent}${textAfter}`);
		this.selectionStart = this.selectionEnd = selectionStart + indent.length + 1;

		this.dispatchEvent(new Event('input', { bubbles: true }));
		return false;
	}

	// Thanks to https://github.com/facebook/react/issues/10135#issuecomment-314441175
	function setNativeValue(element, value) {
		const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
		const prototype = Object.getPrototypeOf(element);
		const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

		if (valueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else {
			valueSetter.call(element, value);
		}
	}
}
