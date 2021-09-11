import { SyntheticEvent } from 'react';

export async function readFile(event: SyntheticEvent<HTMLInputElement>): Promise<File> {
	return new Promise((resolve, reject) => {
		const file = event.currentTarget.files?.[0];
		if (!file) return(reject());

		return resolve(file);
	});
}
