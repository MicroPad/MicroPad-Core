import { Observable, of, shareReplay } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, map } from 'rxjs/operators';
import { initialiseWithHandlers } from 'fend-wasm-web';

export const START_FEND$: Observable<void> = ajax<string>({
	url: 'https://getmicropad.com/cors-proxy/moolah.xml',
	method: 'GET',
	timeout: 3000,
	responseType: 'text'
}).pipe(
	map(xml => {
		const raw = new DOMParser().parseFromString(xml.response, 'application/xml');
		const currencies = new Map<string, number>();
		raw.querySelectorAll('Cube > Cube > Cube').forEach(el => {
			const currency = el.getAttribute('currency');
			const rate = el.getAttribute('rate');
			if (!currency || !rate) throw new Error(`Unexpected currency data format`);
			const rateF = parseFloat(rate);
			if (isNaN(rateF)) throw new Error(`Currency rate (${rate}) for ${currency} was NaN`);
			currencies.set(currency, rateF);
		});
		currencies.set('EUR', 1.0);
		return currencies;
	}),
	map(currencyData => initialiseWithHandlers(currencyData)),
	catchError(err => {
		console.error('Caught an error getting currencies for fend', err);
		initialiseWithHandlers(new Map());
		return of(void 0);
	}),
	shareReplay(1)
);
