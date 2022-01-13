import './TodoListComponent.css';
import React, { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProgressBar } from 'react-materialize';
import Button2 from '../../../Button';

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

	return (
		<div
			className="markdown-element__todo-list-tracker"
			style={{
				marginLeft: '5px',
				marginRight: '5px',
				textAlign: 'center'
			}}>
			<ProgressBar
				className="markdown-element__todo-list-tracker__progress-bar"
				progress={progressValues.done / progressValues.all * 100} />
			<Button2 flat onClick={toggle} style={{ height: 'auto' }}>Show/Hide Completed Items ({progressValues.done}/{progressValues.all})</Button2>
		</div>
	);
}
export default TodoListComponent;

function getProgress(html: string): IProgressValues {
	const virtualDOM = new DOMParser().parseFromString(html, 'text/html');

	const done = virtualDOM.querySelectorAll('.task-list-item input:checked').length;
	const all = virtualDOM.querySelectorAll('.task-list-item').length;

	return { done, all };
}
