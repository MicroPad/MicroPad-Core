import './TodoListComponent.css';
import React, { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { ProgressBar } from 'react-materialize';
import Button2 from '../../../Button';

export interface ITodoListComponentProps {
	progress$: Observable<IProgressValues>;
	toggle: () => void;
}

export interface IProgressValues {
	done: number;
	total: number;
}

const TodoListComponent = (props: ITodoListComponentProps) => {
	const { toggle } = props;

	const [progressValues, setProgressValues] = useState<IProgressValues | null>(null);
	useEffect(() => {
		const watcher$ = props.progress$.subscribe(setProgressValues);
		return () => watcher$.unsubscribe();
	}, [props.progress$]);

	if (!progressValues || progressValues.total < 1) return null;

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
				progress={progressValues.done / progressValues.total * 100} />
			<Button2 flat onClick={toggle} style={{ height: 'auto' }}>Show/Hide Completed Items ({progressValues.done}/{progressValues.total})</Button2>
		</div>
	);
}
export default TodoListComponent;
