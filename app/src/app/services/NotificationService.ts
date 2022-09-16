import { ToastOptions } from '../types/materializecss';

export class NotificationService {
	public static toast(options: Partial<ToastOptions>): void {
		M.toast(options);
	}

	public toast(options: Partial<ToastOptions>): void {
		M.toast(options);
	}

	public dismissToasts() {
		try {
			M.Toast.dismissAll();
		} catch (e) {
			// Swallow this error
			console.error(e);
		}
	}
}
