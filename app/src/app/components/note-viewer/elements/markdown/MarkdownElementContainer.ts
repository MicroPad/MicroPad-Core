import { connect } from 'react-redux';
import MarkdownElementComponent from './MarkdownElementComponent';
import { IStoreState } from '../../../../types';
import { actions } from '../../../../actions';
import { IProgressValues } from './TodoListComponent';

export const MD_START_ATTR = 'data-md-start';
export const MD_END_ATTR = 'data-md-end';
const VALID_MD_TASK_LIST = /^[\t ]*(\d+\.|[-+*])[\t ]+(\[[xX ]?\])/gm;
const CHECKED = /^[\t ]*(\d+\.|[-+*])[\t ]+\[[xX]\]/;

export const markdownElementConnector = connect(
	(state: IStoreState) => ({
		shouldSpellCheck: state.editor.shouldSpellCheck,
		shouldWordWrap: state.editor.shouldWordWrap
	}),
	dispatch => ({
		toggleSpellCheck: () => dispatch(actions.toggleSpellCheck()),
		toggleWordWrap: () => dispatch(actions.toggleWordWrap()),
		openModal: (modal: string) => dispatch(actions.openModal(modal)),
		enableCheckboxes: (md: string, html: string): IProgressValues & { html: string } => {
			const taskCursors: Array<{ start: number, end: number }> = [];
			let done = 0;

			for (const match of md.matchAll(VALID_MD_TASK_LIST)) {
				if (match.index == null || match.length < 3) continue;

				const offset = match[0].length - match[2].length;

				if (CHECKED.test(match[0])) done++;
				taskCursors.push({
					start: match.index + offset,
					end: match.index + match[0].length
				});
			}

			const total = taskCursors.length;
			const virtualDOM = new DOMParser().parseFromString(html, 'text/html');
			const checkboxes = virtualDOM.querySelectorAll('.task-list-item > input');

			// Exit early if there's something fancy going on here, and we can't just do this naively.
			if (checkboxes.length !== taskCursors.length) return {
				done: virtualDOM.querySelectorAll('.task-list-item > input:checked').length,
				total: checkboxes.length,
				html
			};

			let i = 0;
			for (const checkbox of virtualDOM.querySelectorAll('.task-list-item > input')) {
				checkbox.removeAttribute('disabled');
				checkbox.setAttribute(MD_START_ATTR, taskCursors[i].start.toString());
				checkbox.setAttribute(MD_END_ATTR, taskCursors[i++].end.toString());
			}

			return { done, total, html: virtualDOM.documentElement.innerHTML };
		},
		toggleMdCheckbox: (md: string, change: { start, end, state: boolean }) => {
			return md.substring(0, change.start) + (change.state ? '[X]' : '[ ]') + md.substring(change.end);
		}
	})
);

export default markdownElementConnector(MarkdownElementComponent);

