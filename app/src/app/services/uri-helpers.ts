const DYNAMIC_URI_REGEX = /^data:|javascript:|vbscript:/i

export function isDynamicUri(uri: string): boolean {
	return DYNAMIC_URI_REGEX.test(uri);
}
