import { Store } from 'redux';
import { IStoreState } from './types';
import { MicroPadAction } from './actions';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ThemeValues } from './ThemeValues';

const STYLE_ELEMENT = 'dynamic-styles';

export function createDynamicCss(store: Store<IStoreState, MicroPadAction>): void {
	const state$ = new Observable<IStoreState>(subscriber => {
		subscriber.next(store.getState());
		return store.subscribe(() => {
			subscriber.next(store.getState());
		});
	});

	state$.pipe(
		map(s => s.app.theme),
		distinctUntilChanged(),
		map(themeName => ThemeValues[themeName])
	).subscribe(theme => {
		let styleEl: HTMLStyleElement | undefined = document.getElementById(STYLE_ELEMENT) as HTMLStyleElement | undefined;
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = STYLE_ELEMENT;
			document.head.appendChild(styleEl);
		}

		styleEl.innerHTML = `
			input:not([type]):focus:not([readonly]), input[type=text]:focus:not([readonly]), input[type=password]:focus:not([readonly]), input[type=email]:focus:not([readonly]), input[type=url]:focus:not([readonly]), input[type=time]:focus:not([readonly]), input[type=date]:focus:not([readonly]), input[type=datetime]:focus:not([readonly]), input[type=datetime-local]:focus:not([readonly]), input[type=tel]:focus:not([readonly]), input[type=number]:focus:not([readonly]), input[type=search]:focus:not([readonly]), textarea.materialize-textarea:focus:not([readonly]) {
				border-color: ${theme.accent} !important;
				box-shadow: 0 1px 0 0 ${theme.accent} !important;
				color: ${theme.text};
			}

			.btn:hover, .btn-large:hover, .btn-small:hover {
				background-color: ${theme.accent};
			}
			
			.modal {
				background-color: ${theme.background};
				color: ${theme.text};
			}
			
			.modal > * {
				color: ${theme.text} !important;
			}
			
			.modal .modal-footer {
				background-color: ${theme.chrome};
				color: ${theme.explorerContent};
			}
			
			.modal .modal-footer > * {
				color: ${theme.explorerContent} !important;
			}
			
			.modal .modal-content a, .modal .modal-content input {
				color: ${theme.links};
			}
		`;
	});
}
