import { isDev } from './util';

export function isReadOnlyNotebook(title: string) {
	// All notebooks are editable in dev mode
	if (isDev()) {
		return false;
	}

	return title === 'Help';
}
