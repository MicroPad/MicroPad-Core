export function stringify(obj: object) {
	const seen: any[] = [];
	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === 'object') {
			if (seen.includes(val)) return;
			seen.push(val);
		}
		return val;
	});
}
