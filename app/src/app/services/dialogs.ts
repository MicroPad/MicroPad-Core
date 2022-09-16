import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-top.css';

const Vex = require('vex-js');
const VexDialog = require('vex-dialog');

Vex.registerPlugin(VexDialog);
Vex.defaultOptions!.className = 'vex-theme-top';

type VexOpts = {
	message?: string,
	unsafeMessage?: string,
	input?: string
};

export type RememberMePromptRes = {
	secret: string,
	remember: boolean
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

	public static promptSecureRememberMe = (message: string): Promise<RememberMePromptRes | undefined> => {
		const checkboxId = `vex__checkbox--${Dialog.ID_COUNT++}`;

		return Dialog.loadVex<{ secret?: string, remember?: '1' } | undefined>(
			Vex.dialog.open,
			{
				message,
				input: `
				<input name="secret" type="password" class="vex-dialog-prompt-input" />
				<div class="vex-custom-input-wrapper" style="padding-top: 1em;">
					<label for="${checkboxId}" style="color: var(--mp-theme-explorerContent);">
						<input id="${checkboxId}" name="remember" class="filled-in" type="checkbox" class="vex-dialog-prompt-input" value="1" />
						<span>Remember</span>
					</label>
				</div>
			`,
			}
		).then(res => {
			if (!res?.secret) return undefined;
			return {
				secret: res.secret,
				remember: res.remember === '1'
			};
		});
	};

	private static ID_COUNT: number = 0;

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
