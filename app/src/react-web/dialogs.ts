import * as Vex from 'vex-js';
import * as VexDialog from 'vex-dialog';
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-top.css';

Vex.registerPlugin(VexDialog);
Vex.defaultOptions!.className = 'vex-theme-top';

export namespace Dialog {
	export const alert = (message: string) => Vex.dialog.alert(message);

	export const confirm = (message: string): Promise<boolean> => new Promise(resolve =>
		Vex.dialog.confirm({
			message,
			callback: value => resolve(value)
		})
	);

	export const prompt = (message: string, placeholder?: string): Promise<string> =>
		new Promise(resolve => {
			setTimeout(() => {
				Vex.dialog.prompt({
					message,
					placeholder,
					callback: value => resolve(value)
				});
			}, 0);
		});

	export const promptSecure = (message: string): Promise<string> =>
		new Promise(resolve => {
			setTimeout(() => {
				Vex.dialog.open({
					message,
					input: '<input name="vex" type="password" class="vex-dialog-prompt-input" />',
					callback: value => resolve(value.vex)
				});
			}, 0);
		});
}
