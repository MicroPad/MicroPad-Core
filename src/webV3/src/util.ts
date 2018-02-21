export function stringify(obj: object) {
	const seen: any[] = [];
	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === 'object') {
			if (seen.indexOf(val) > -1) return;
			seen.push(val);
		}
		return val;
	});
}
