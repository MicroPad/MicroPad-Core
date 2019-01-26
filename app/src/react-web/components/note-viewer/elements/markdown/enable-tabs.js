export function enableTabs(event) {
	if (event.keyCode === 9) {
		const v = this.value;
		const s = this.selectionStart;
		const e = this.selectionEnd;

		setNativeValue(this, v.substring(0, s) + '\t' + v.substring(e));
		this.selectionStart = this.selectionEnd = s + 1;

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
