import * as React from 'react';
import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ITodoListComponentProps {
	html$: Observable<string>;
	toggle: () => void;
}

interface IProgressValues {
	done: number;
	all: number;
}

const TodoListComponent = (props: ITodoListComponentProps) => {
	const { toggle } = props;

	const [progressValues, setProgressValues] = useState<IProgressValues | null>(null);
	useEffect(() => {
		const watcher$ = props.html$.pipe(map(getProgress)).subscribe(setProgressValues);
		return () => watcher$.unsubscribe();
	}, [props.html$]);

	if (!progressValues || progressValues.all < 1) return null;

	const meterStyle = {
		width: '100%'
	};

	return (
		<div
			className="markdown-element__todo-list-tracker"
			style={{
				marginLeft: '5px',
				marginRight: '5px',
				textAlign: 'center'
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
