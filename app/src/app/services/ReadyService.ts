import { fromEvent } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export const domReady$ = fromEvent(window, 'load').pipe(
	shareReplay(1)
);
