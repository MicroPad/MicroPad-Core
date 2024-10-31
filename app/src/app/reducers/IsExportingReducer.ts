import { AbstractReducer } from './AbstractReducer';
import { actions } from '../actions';

export type IsExportingState = {
	isLoading: boolean;
	error?: Error;
};

export class IsExportingReducer extends AbstractReducer<IsExportingState> {
	public readonly key = 'isExporting';
	public readonly initialState: IsExportingState = { isLoading: false };

	constructor() {
		super();

		// Export loading states
		this.handle(
			() => ({ isLoading: true }),
			actions.exportAll.started,
			actions.exportToMarkdown.started
		);

		this.handle(
			() => ({ isLoading: false }),
			actions.exportAll.done,
			actions.exportToMarkdown.done
		);

		this.handle(
			(_state, action) => ({ isLoading: false, error: action.payload.error }),
			actions.exportAll.failed,
			actions.exportToMarkdown.failed
		);
	}
}
