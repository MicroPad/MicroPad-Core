import * as React from 'react';

export interface ITodoListComponentProps {
	html: string;
	toggle: () => void;
}

interface IProgressValues {
	done: number;
	all: number;
}

const TodoListComponent = (props: ITodoListComponentProps) => {
	const { toggle, html } = props;
	const progressValues = getProgress(html);

	const meterStyle = {
		width: '100%'
	};

	return (
		<div
			className="markdown-element__todo-list-tracker"
			style={{
				marginLeft: '5px',
				marginRight: '5px',
				textAlign: 'center',
				display: (progressValues.all > 0) ? undefined : 'none'
			}}>
			<meter
				value={progressValues.done}
				min={0}
				max={progressValues.all}
				style={meterStyle}>
				{Math.round((progressValues.done / progressValues.all) * 100)}%
			</meter>

			<br /><a href="#!" onClick={toggle}>Show/Hide Completed Items ({progressValues.done}/{progressValues.all})</a>
		</div>
	);
}
export default TodoListComponent;

function getProgress(html: string): IProgressValues {
	// Create virtual element of the html given
	const element = document.createElement('div');
	element.innerHTML = html;

	const done = element.querySelectorAll('.task-list-item input:checked').length;
	const all = element.querySelectorAll('.task-list-item').length;

	return { done, all };
}
