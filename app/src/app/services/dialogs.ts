import * as Vex from 'vex-js';
import * as VexDialog from 'vex-dialog';
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-top.css';

Vex.registerPlugin(VexDialog);
Vex.defaultOptions!.className = 'vex-theme-top';

type VexOpts = {
	message?: string,
	unsafeMessage?: string,
	input?: string
};

export class Dialog {
	public static alert = (message: string) => Dialog.loadVex(Vex.dialog.alert, { message })

	public static confirm = (message: string): Promise<boolean> => Dialog.loadVex<boolean>(
		Vex.dialog.confirm,
		{ message }
	)

	public static confirmUnsafe = (unsafeMessage: string): Promise<boolean> => Dialog.loadVex(
		Vex.dialog.confirm,
		{ unsafeMessage }
	)

	public static prompt = (message: string): Promise<string | undefined> => Dialog.loadVex(
		Vex.dialog.prompt,
		{
			message,
			input: '<input name="vex" type="text" class="vex-dialog-prompt-input" autocomplete="off">'
		}
	)

	public static promptSecure = (message: string): Promise<string | undefined> => Dialog.loadVex(
		Vex.dialog.prompt,
		{
			message,
			input: '<input name="vex" type="password" class="vex-dialog-prompt-input" />',
		}
	)

	private static loadVex<T>(vexFn: (opts: any) => void, opts: VexOpts): Promise<T> {
		return new Promise<T>(resolve => {
			setTimeout(() => {
				let modal = document.querySelector<HTMLDivElement>('.modal.open');
				if (modal) modal.style.display = 'none';

				vexFn.bind(Vex.dialog)({
					...opts,
					callback: (value: T) => {
						if (modal) modal.style.display = 'initial';
						resolve(value)
					}
				});
			}, 10);
		});
	}
}
