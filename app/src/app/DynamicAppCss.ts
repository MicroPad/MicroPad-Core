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
		const rootStyles = document.documentElement.style;
		Object.entries(theme)
			.filter(([_k, v]) => typeof v === 'string')
			.forEach(([k, v]: [string, string]) => rootStyles.setProperty(`--mp-theme-${k}`, v));

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
			
			input:not([type]):focus:not([readonly])+label, input[type=text]:not(.browser-default):focus:not([readonly])+label, input[type=password]:not(.browser-default):focus:not([readonly])+label, input[type=email]:not(.browser-default):focus:not([readonly])+label, input[type=url]:not(.browser-default):focus:not([readonly])+label, input[type=time]:not(.browser-default):focus:not([readonly])+label, input[type=date]:not(.browser-default):focus:not([readonly])+label, input[type=datetime]:not(.browser-default):focus:not([readonly])+label, input[type=datetime-local]:not(.browser-default):focus:not([readonly])+label, input[type=tel]:not(.browser-default):focus:not([readonly])+label, input[type=number]:not(.browser-default):focus:not([readonly])+label, input[type=search]:not(.browser-default):focus:not([readonly])+label, textarea.materialize-textarea:focus:not([readonly])+label {
				color: ${theme.background === '#fff' ? theme.chrome : theme.text} !important;
			}

			.btn:hover, .btn-flat:hover, .btn-large:hover, .btn-small:hover {
				background-color: ${theme.accent};
				color: ${theme.accentContent};
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
			
			.modal, .modal .modal-content input {
				color: ${theme.text};
			}
			
			.modal-content a {
				color: ${theme.links};
			}
			
			.vex-dialog-button-primary {
				background-color: ${theme.accent} !important;
				color: ${theme.accentContent} !important;
			}
			
			.vex.vex-theme-top .vex-content {
				background-color: ${theme.chrome};
				color: ${theme.explorerContent};
			}
			
			.vex.vex-theme-top .vex-content input {
				background-color: ${theme.background} !important;
				color: ${theme.text};
			}
		`;
	});
}
